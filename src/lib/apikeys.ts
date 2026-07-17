import { createHash, randomBytes } from "node:crypto";

/**
 * API keys: `eb_` + 48 hex chars (24 random bytes). Plaintext is returned
 * exactly once at creation; only its SHA-256 hash is persisted, so a database
 * leak never exposes usable credentials.
 */

export function hashApiKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function generateApiKey(): { plain: string; prefix: string; hash: string } {
  const plain = `eb_${randomBytes(24).toString("hex")}`;
  return { plain, prefix: plain.slice(0, 11), hash: hashApiKey(plain) };
}

/** Webhook signing secrets, Stripe-style: whsec_ + 32 random bytes in hex. */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("hex")}`;
}
