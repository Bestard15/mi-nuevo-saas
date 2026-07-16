import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { endUsers } from "@/db/schema";

const ANON_COOKIE = "eb_uid";

/**
 * Read-only anonymous device id (pages can call this; it never sets cookies).
 */
export async function getAnonUid(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ANON_COOKIE)?.value ?? null;
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
 * Gets or creates the anonymous end user for a project. Must be called from a
 * server action or route handler (it may set the identity cookie).
 *
 * In Fase 2 the widget SDK's JWT identify() will upsert real end users with
 * revenue attributes; anonymous visitors always carry mrr = 0.
 */
export async function getOrCreateAnonEndUser(projectId: string) {
  const jar = await cookies();
  let uid = jar.get(ANON_COOKIE)?.value;
  if (!uid) {
    uid = crypto.randomUUID();
    jar.set(ANON_COOKIE, uid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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
