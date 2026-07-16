import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations, projects } from "@/db/schema";

export type BillingPlan = "free" | "starter" | "growth";

/**
 * Flat pricing — the structural answer to Canny's per-tracked-user model.
 * priceId comes from env so test/live Stripe accounts don't touch the code.
 */
export const PLANS: Record<
  BillingPlan,
  { name: string; price: number; priceId: string | null; features: string[] }
> = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "Board de feedback, roadmap y changelog",
      "Boards privados incluidos",
      "Widget embebible < 30 KB",
      "SSO de usuarios con atributos de revenue",
      "Emails de «Lanzado» a los votantes",
    ],
  },
  starter: {
    name: "Starter",
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER ?? null,
    features: [
      "Todo lo del plan Free",
      "API REST pública con API keys",
      "Priorización por MRR sin límites",
      "Soporte por email",
    ],
  },
  growth: {
    name: "Growth",
    price: 49,
    priceId: process.env.STRIPE_PRICE_GROWTH ?? null,
    features: [
      "Todo lo del plan Starter",
      "Webhooks salientes firmados (HMAC)",
      "Integraciones en tiempo real",
      "Soporte prioritario",
    ],
  },
};

/** Which paid capability each plan unlocks. Gates run at creation time. */
export function planAllows(plan: BillingPlan, feature: "api" | "webhooks"): boolean {
  if (feature === "api") return plan === "starter" || plan === "growth";
  return plan === "growth";
}

export function planFromPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  if (priceId === PLANS.starter.priceId) return "starter";
  if (priceId === PLANS.growth.priceId) return "growth";
  return null;
}

let stripeClient: Stripe | null = null;

/** Lazy Stripe client; null when STRIPE_SECRET_KEY isn't configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

/** The organization (with its plan) that owns a project. */
export async function getProjectOrganization(projectId: string) {
  const rows = await db
    .select({ organization: organizations })
    .from(projects)
    .innerJoin(organizations, eq(projects.organizationId, organizations.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows[0]?.organization ?? null;
}
