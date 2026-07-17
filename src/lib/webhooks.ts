import { createHmac } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";

import { db } from "@/db";
import { webhookEndpoints } from "@/db/schema";

/** Events customers can subscribe their servers to. */
export const WEBHOOK_EVENTS = [
  "post.created",
  "post.status_changed",
  "post.voted",
  "comment.created",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const DELIVERY_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [0, 2_000, 8_000]; // 3 intentos: inmediato, +2s, +8s

/**
 * Stripe-style signature so receivers can verify authenticity and freshness:
 *   X-Echoboard-Signature: t=<unix_ts>,v1=<hex(hmac_sha256(secret, "<ts>.<body>"))>
 */
export function signWebhookPayload(secret: string, timestamp: number, body: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

/**
 * Fans an event out to every active endpoint of the project subscribed to it
 * (an empty subscription list means "all events"). Runs after the response is
 * sent (`next/server` after()), with per-endpoint retries — a slow or broken
 * customer server can never slow down or break the product itself.
 */
export function dispatchWebhookEvent(
  projectId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): void {
  after(async () => {
    try {
      const endpoints = await db.query.webhookEndpoints.findMany({
        where: and(
          eq(webhookEndpoints.projectId, projectId),
          eq(webhookEndpoints.isActive, true)
        ),
      });
      const subscribed = endpoints.filter(
        (e) => e.events.length === 0 || e.events.includes(event)
      );
      if (subscribed.length === 0) return;

      const body = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        createdAt: new Date().toISOString(),
        data,
      });

      await Promise.allSettled(subscribed.map((endpoint) => deliver(endpoint, event, body)));
    } catch (error) {
      console.error("[webhooks] fallo en el dispatch:", error);
    }
  });
}

async function deliver(
  endpoint: typeof webhookEndpoints.$inferSelect,
  event: WebhookEvent,
  body: string
): Promise<void> {
  let lastStatus = 0;

  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    const timestamp = Math.floor(Date.now() / 1000);
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "Echoboard-Webhooks/1.0",
          "x-echoboard-event": event,
          "x-echoboard-signature": signWebhookPayload(endpoint.secret, timestamp, body),
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      lastStatus = response.status;
      if (response.ok) break; // 2xx: entregado
    } catch {
      lastStatus = 0; // red caída / timeout / DNS
    }
  }

  await db
    .update(webhookEndpoints)
    .set({ lastStatus, lastAttemptAt: new Date() })
    .where(eq(webhookEndpoints.id, endpoint.id))
    .catch(() => {});
}
