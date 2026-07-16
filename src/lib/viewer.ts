import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { endUsers } from "@/db/schema";
import { ssoCookieName, verifyEndUserSession } from "@/lib/sso";

const ANON_COOKIE = "eb_uid";

/**
 * Read-only anonymous device id (pages can call this; it never sets cookies).
 */
export async function getAnonUid(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ANON_COOKIE)?.value ?? null;
}

/**
 * The end user identified via the SSO cookie for this project, or null.
 * Safe to call from server components (read-only).
 */
export async function findSsoEndUser(projectId: string) {
  const jar = await cookies();
  const token = jar.get(ssoCookieName(projectId))?.value;
  if (!token) return null;
  const endUserId = await verifyEndUserSession(token, projectId);
  if (!endUserId) return null;
  return (
    (await db.query.endUsers.findFirst({
      where: and(eq(endUsers.id, endUserId), eq(endUsers.projectId, projectId)),
    })) ?? null
  );
}

/**
 * Finds the anonymous end user for a project, if the visitor has one.
 * Safe to call from server components.
 */
export async function findAnonEndUser(projectId: string) {
  const uid = await getAnonUid();
  if (!uid) return null;
  return (
    (await db.query.endUsers.findFirst({
      where: and(eq(endUsers.projectId, projectId), eq(endUsers.externalId, `anon:${uid}`)),
    })) ?? null
  );
}

/**
 * The current visitor's end-user identity for a project, preferring the SSO
 * (JWT-identified) session over the anonymous cookie. Read-only.
 */
export async function resolveEndUser(projectId: string) {
  return (await findSsoEndUser(projectId)) ?? (await findAnonEndUser(projectId));
}

/**
 * Like resolveEndUser but creates the anonymous identity when the visitor has
 * none. Must be called from a server action or route handler (it may set the
 * identity cookie). Identified (SSO) visitors always win over anonymous ones.
 */
export async function resolveOrCreateEndUser(projectId: string) {
  const identified = await findSsoEndUser(projectId);
  if (identified) return identified;
  return getOrCreateAnonEndUser(projectId);
}

/**
 * Gets or creates the anonymous end user for a project. Must be called from a
 * server action or route handler (it may set the identity cookie).
 * Anonymous visitors always carry mrr = 0.
 */
export async function getOrCreateAnonEndUser(projectId: string) {
  const jar = await cookies();
  let uid = jar.get(ANON_COOKIE)?.value;
  if (!uid) {
    uid = crypto.randomUUID();
    // SameSite=None in production so the anonymous identity also works when
    // the board lives inside the customer's iframe (the embed widget).
    const production = process.env.NODE_ENV === "production";
    jar.set(ANON_COOKIE, uid, {
      httpOnly: true,
      sameSite: production ? "none" : "lax",
      secure: production,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  const externalId = `anon:${uid}`;

  await db.insert(endUsers).values({ projectId, externalId }).onConflictDoNothing();

  const endUser = await db.query.endUsers.findFirst({
    where: and(eq(endUsers.projectId, projectId), eq(endUsers.externalId, externalId)),
  });
  if (!endUser) throw new Error("No se pudo crear la identidad del visitante");
  return endUser;
}
