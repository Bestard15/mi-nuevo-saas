"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { changelogEntries, projects } from "@/db/schema";
import { requireProjectMember } from "@/lib/authz";
import { changelogEntrySchema, firstIssue } from "@/lib/validators";

export type ActionState = { error: string } | undefined;

function revalidateChangelog(slug: string) {
  revalidatePath(`/p/${slug}/changelog`);
  revalidatePath(`/dashboard/${slug}/changelog`);
}

/** Creates a draft changelog entry. Members only. */
export async function createChangelogEntry(
  projectId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = changelogEntrySchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await requireProjectMember(projectId);
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return { error: "El proyecto no existe" };

  await db.insert(changelogEntries).values({
    projectId,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  revalidateChangelog(project.slug);
  return undefined;
}

async function getEntryWithProject(entryId: string) {
  return db.query.changelogEntries.findFirst({
    where: eq(changelogEntries.id, entryId),
    with: { project: true },
  });
}

/** Edits an entry's title/body. Members only. */
export async function updateChangelogEntry(
  entryId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = changelogEntrySchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const entry = await getEntryWithProject(entryId);
  if (!entry) return { error: "La entrada no existe" };
  await requireProjectMember(entry.projectId);

  await db
    .update(changelogEntries)
    .set({ title: parsed.data.title, body: parsed.data.body, updatedAt: new Date() })
    .where(eq(changelogEntries.id, entryId));

  revalidateChangelog(entry.project.slug);
  return undefined;
}

/** Publishes a draft (or re-publishes with a fresh date). Members only. */
export async function publishChangelogEntry(entryId: string): Promise<void> {
  const entry = await getEntryWithProject(entryId);
  if (!entry) return;
  await requireProjectMember(entry.projectId);

  await db
    .update(changelogEntries)
    .set({ publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(changelogEntries.id, entryId));

  revalidateChangelog(entry.project.slug);
}

/** Moves a published entry back to draft. Members only. */
export async function unpublishChangelogEntry(entryId: string): Promise<void> {
  const entry = await getEntryWithProject(entryId);
  if (!entry) return;
  await requireProjectMember(entry.projectId);

  await db
    .update(changelogEntries)
    .set({ publishedAt: null, updatedAt: new Date() })
    .where(eq(changelogEntries.id, entryId));

  revalidateChangelog(entry.project.slug);
}

/** Deletes an entry. Members only. */
export async function deleteChangelogEntry(entryId: string): Promise<void> {
  const entry = await getEntryWithProject(entryId);
  if (!entry) return;
  await requireProjectMember(entry.projectId);

  await db.delete(changelogEntries).where(eq(changelogEntries.id, entryId));

  revalidateChangelog(entry.project.slug);
}
