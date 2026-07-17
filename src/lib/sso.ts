import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

/**
 * SSO identify flow:
 *
 * 1. The customer's backend signs a short-lived HS256 JWT with the project's
 *    ssoSecret, carrying their user's identity + revenue attributes.
 * 2. The user lands on /api/sso/{projectSlug}?token=... (or the widget POSTs
 *    it); we verify it, upsert the end_user, and set our own session cookie.
 * 3. From then on, votes/posts/comments by that visitor carry their MRR, and
 *    private boards become visible to them.
 */

export const identifyPayloadSchema = z.object({
  id: z.union([z.string().min(1).max(200), z.number()]).transform(String),
  email: z.string().email().max(320).optional(),
  name: z.string().min(1).max(200).optional(),
  avatarUrl: z.string().url().max(2000).optional(),
  company: z.string().min(1).max(200).optional(),
  plan: z.string().min(1).max(100).optional(),
  mrr: z.coerce.number().min(0).max(10_000_000).optional(),
});

export type IdentifyPayload = z.infer<typeof identifyPayloadSchema>;

const encoder = new TextEncoder();

/** Verifies a customer-signed identify token against the project's secret. */
export async function verifyIdentifyToken(
  token: string,
  ssoSecret: string
): Promise<IdentifyPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(ssoSecret), {
      algorithms: ["HS256"],
    });
    const parsed = identifyPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Our own end-user session cookie (one per project), signed with AUTH_SECRET.
// ---------------------------------------------------------------------------

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  return encoder.encode(secret);
}

export function ssoCookieName(projectId: string): string {
  return `eb_sso_${projectId}`;
}

export async function signEndUserSession(
  endUserId: string,
  projectId: string
): Promise<string> {
  return new SignJWT({ sub: endUserId, pid: projectId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifyEndUserSession(
  token: string,
  projectId: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
    });
    if (payload.pid !== projectId || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export const SSO_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS;
