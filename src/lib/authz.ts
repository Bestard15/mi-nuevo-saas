import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, projects } from "@/db/schema";
import { findSsoEndUser } from "@/lib/viewer";

/** Returns the session user id, or null when not signed in. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** True when the given user belongs to the organization that owns the project. */
export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .innerJoin(projects, eq(projects.organizationId, memberships.organizationId))
    .where(and(eq(projects.id, projectId), eq(memberships.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Everything access control needs to know about the current visitor, in one
 * lookup: team membership (dashboard session) and SSO-identified end user.
 *
 * Private projects/boards are visible to members OR identified end users —
 * never to anonymous visitors. That's the strict rule for private boards:
 * "your customers", proven by a JWT their vendor signed, and nobody else.
 */
export async function getViewerContext(projectId: string) {
  const userId = await getSessionUserId();
  const isMember = userId ? await isProjectMember(projectId, userId) : false;
  const ssoEndUser = isMember ? null : await findSsoEndUser(projectId);
  return {
    userId,
    isMember,
    ssoEndUser,
    canViewPrivate: isMember || ssoEndUser !== null,
  };
}

/**
 * Ensures the current session user is a member of the project's organization.
 * Returns the user id; throws when unauthenticated or not a member.
 */
export async function requireProjectMember(projectId: string): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("No autenticado");
  if (!(await isProjectMember(projectId, userId))) {
    throw new Error("No tienes permisos sobre este proyecto");
  }
  return userId;
}
