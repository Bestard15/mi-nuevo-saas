"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { memberships, organizations, projects } from "@/db/schema";
import { getSessionUserId } from "@/lib/authz";
import { getStripe, PLANS, type BillingPlan } from "@/lib/billing";

export type ActionState = { error: string } | undefined;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** The org + project slug, only if the current user belongs to the org. */
async function requireOrgForMember(organizationId: string, projectSlug: string) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const rows = await db
    .select({ organization: organizations })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(
      and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId))
    )
    .limit(1);
  if (rows.length === 0) throw new Error("No tienes permisos sobre esta organización");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.organizationId, organizationId), eq(projects.slug, projectSlug)),
  });
  if (!project) throw new Error("Proyecto no encontrado");

  return rows[0].organization;
}

/**
 * Starts a Stripe Checkout (subscription) for a paid plan. The webhook —
 * not this action — is what flips the org's plan, so the state always
 * reflects what Stripe actually charged.
 */
export async function createCheckoutSession(
  organizationId: string,
  projectSlug: string,
  plan: BillingPlan
): Promise<ActionState> {
  const org = await requireOrgForMember(organizationId, projectSlug);

  const priceId = PLANS[plan]?.priceId;
  if (plan === "free" || !priceId) {
    return { error: "Plan inválido o sin precio configurado (STRIPE_PRICE_*)" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)" };
  }

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  const billingUrl = `${appUrl()}/dashboard/${projectSlug}/billing`;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${billingUrl}?checkout=success`,
    cancel_url: `${billingUrl}?checkout=cancelled`,
    // El webhook usa esta metadata para resolver la organización.
    subscription_data: { metadata: { organizationId: org.id } },
    metadata: { organizationId: org.id },
  });
  if (!session.url) return { error: "Stripe no devolvió URL de checkout" };

  redirect(session.url);
}

/**
 * Opens the Stripe Customer Portal so customers self-manage their
 * subscription (upgrade, downgrade, cancel, invoices, card).
 */
export async function createPortalSession(
  organizationId: string,
  projectSlug: string
): Promise<ActionState> {
  const org = await requireOrgForMember(organizationId, projectSlug);

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)" };
  }
  if (!org.stripeCustomerId) {
    return { error: "Esta organización aún no tiene cliente en Stripe" };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/${projectSlug}/billing`,
  });

  redirect(session.url);
}
