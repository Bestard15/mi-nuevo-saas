"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { boards, memberships, organizations, projects, statuses } from "@/db/schema";
import { getSessionUserId } from "@/lib/authz";
import { slugify } from "@/lib/slug";
import { createProjectSchema, firstIssue } from "@/lib/validators";

export type ActionState = { error: string } | undefined;

const DEFAULT_STATUSES = [
  { name: "Abierto", category: "open", color: "#6b7280", position: 0, isDefault: true },
  { name: "Planificado", category: "planned", color: "#8b5cf6", position: 1, isDefault: false },
  { name: "En progreso", category: "in_progress", color: "#3b82f6", position: 2, isDefault: false },
  { name: "Lanzado", category: "shipped", color: "#22c55e", position: 3, isDefault: false },
  { name: "Cerrado", category: "closed", color: "#ef4444", position: 4, isDefault: false },
] as const;

async function uniqueProjectSlug(base: string): Promise<string> {
  const root = slugify(base) || "proyecto";
  let candidate = root;
  for (let i = 2; ; i++) {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${root}-${i}`;
  }
}

/**
 * Creates an organization + project + default board + default statuses and
 * makes the current user its owner. One-shot onboarding for the MVP.
 */
export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const parsed = createProjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name } = parsed.data;

  const slug = await uniqueProjectSlug(name);

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name, slug: `org-${slug}` })
      .returning();
    await tx.insert(memberships).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });
    const [project] = await tx
      .insert(projects)
      .values({ organizationId: org.id, name, slug })
      .returning();
    await tx.insert(boards).values({
      projectId: project.id,
      name: "Peticiones de features",
      slug: "features",
      description: "Cuéntanos qué construir a continuación",
      position: 0,
    });
    await tx
      .insert(statuses)
      .values(DEFAULT_STATUSES.map((s) => ({ ...s, projectId: project.id })));
  });

  redirect(`/p/${slug}`);
}
