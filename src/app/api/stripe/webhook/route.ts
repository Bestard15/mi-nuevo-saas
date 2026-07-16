import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { planFromPriceId } from "@/lib/billing";

/**
 * POST /api/stripe/webhook — the ONLY writer of organization.plan.
 * Signature-verified with STRIPE_WEBHOOK_SECRET; requests that don't
 * prove they come from Stripe are rejected before touching the DB.
 *
 * Handled events:
 *  - customer.subscription.created / .updated → plan por price id
 *  - customer.subscription.deleted           → vuelta a free
 */

// Verification only needs the webhook secret, never the API key, so a
// placeholder lets constructEvent run in environments without one.
function stripeForVerification(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");
}

async function resolveOrganization(sub: Stripe.Subscription) {
  const byMetadata = sub.metadata?.organizationId;
  if (byMetadata) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, byMetadata),
    });
    if (org) return org;
  }
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  return (
    (await db.query.organizations.findFirst({
      where: eq(organizations.stripeCustomerId, customerId),
    })) ?? null
  );
}

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const org = await resolveOrganization(sub);
  if (!org) {
    console.warn(`[stripe] suscripción ${sub.id} sin organización resoluble`);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id;
  const plan = planFromPriceId(priceId);
  const isActive = sub.status === "active" || sub.status === "trialing";
  const periodEnd = sub.items.data[0]?.current_period_end;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  await db
    .update(organizations)
    .set({
      plan: isActive && plan ? plan : "free",
      stripeCustomerId: customerId ?? org.stripeCustomerId,
      stripeSubscriptionId: sub.id,
      planRenewsAt: isActive && periodEnd ? new Date(periodEnd * 1000) : null,
    })
    .where(eq(organizations.id, org.id));
}

async function removeSubscription(sub: Stripe.Subscription): Promise<void> {
  const org = await resolveOrganization(sub);
  if (!org) return;
  await db
    .update(organizations)
    .set({ plan: "free", stripeSubscriptionId: null, planRenewsAt: null })
    .where(eq(organizations.id, org.id));
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET no configurado" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la cabecera stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripeForVerification().webhooks.constructEventAsync(
      payload,
      signature,
      secret
    );
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await applySubscription(event.data.object);
      break;
    case "customer.subscription.deleted":
      await removeSubscription(event.data.object);
      break;
    default:
      // Eventos no manejados se aceptan (200) para que Stripe no reintente.
      break;
  }

  return NextResponse.json({ received: true });
}
