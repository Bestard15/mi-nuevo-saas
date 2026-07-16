import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, projects } from "@/db/schema";

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
