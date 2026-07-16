"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { boards, posts, statuses } from "@/db/schema";
import { getViewerContext, requireProjectMember } from "@/lib/authz";
import { notifyShipped } from "@/lib/shipped";
import { resolveOrCreateEndUser } from "@/lib/viewer";
import { createPostSchema, firstIssue, updatePostSchema } from "@/lib/validators";
import { dispatchWebhookEvent } from "@/lib/webhooks";

export type ActionState = { error: string } | undefined;

/** Only same-origin relative paths — the form field is client-controlled. */
function safeRelativePath(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  return null;
}

async function getBoardWithProject(boardId: string) {
  return db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    with: { project: true },
  });
}

/**
 * Creates a post on a board. Team members author with their user account;
 * visitors author through their (anonymous, mrr=0) end-user identity.
 * Private projects only accept posts from members.
 */
export async function createPost(
  boardId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const board = await getBoardWithProject(boardId);
  if (!board) return { error: "El board no existe" };

  const { userId, isMember, canViewPrivate } = await getViewerContext(board.projectId);
  if ((board.project.isPrivate || board.isPrivate) && !canViewPrivate) {
    return { error: "Este board es privado" };
  }

  const defaultStatus = await db.query.statuses.findFirst({
    where: and(eq(statuses.projectId, board.projectId), eq(statuses.isDefault, true)),
  });

  let postId = "";
  let authorExternalId: string | null = null;
  if (isMember && userId) {
    const [post] = await db
      .insert(posts)
      .values({
        boardId,
        title: parsed.data.title,
        content: parsed.data.content || null,
        statusId: defaultStatus?.id ?? null,
        authorUserId: userId,
      })
      .returning({ id: posts.id });
    postId = post.id;
  } else {
    const endUser = await resolveOrCreateEndUser(board.projectId);
    const [post] = await db
      .insert(posts)
      .values({
        boardId,
        title: parsed.data.title,
        content: parsed.data.content || null,
        statusId: defaultStatus?.id ?? null,
        authorEndUserId: endUser.id,
      })
      .returning({ id: posts.id });
    postId = post.id;
    authorExternalId = endUser.externalId;
  }

  dispatchWebhookEvent(board.projectId, "post.created", {
    postId,
    title: parsed.data.title,
    content: parsed.data.content || null,
    boardSlug: board.slug,
    status: defaultStatus ? { id: defaultStatus.id, name: defaultStatus.name } : null,
    authorEndUserExternalId: authorExternalId,
    source: "board",
  });

  revalidatePath(`/p/${board.project.slug}`);
  revalidatePath(`/embed/${board.project.slug}`);
  // The embed widget posts a redirectTo so the flow stays inside the iframe.
  redirect(
    safeRelativePath(formData.get("redirectTo")) ??
      `/p/${board.project.slug}/posts/${postId}`
  );
}

/** Edits a post's title/content. Members of the project only. */
export async function updatePost(
  postId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updatePostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: { with: { project: true } } },
  });
  if (!post) return { error: "El post no existe" };

  await requireProjectMember(post.board.projectId);

  await db
    .update(posts)
    .set({
      title: parsed.data.title,
      content: parsed.data.content || null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  const slug = post.board.project.slug;
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/p/${slug}/posts/${postId}`);
  return undefined;
}

/** Deletes a post. Members of the project only. */
export async function deletePost(postId: string): Promise<void> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: { with: { project: true } } },
  });
  if (!post) return;

  await requireProjectMember(post.board.projectId);
  await db.delete(posts).where(eq(posts.id, postId));

  const slug = post.board.project.slug;
  revalidatePath(`/p/${slug}`);
  redirect(`/p/${slug}`);
}

/**
 * Moves a post to another status (Open → Planned → In Progress → Shipped…).
 * Members only; the target status must belong to the same project.
 */
export async function setPostStatus(postId: string, statusId: string): Promise<void> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: { with: { project: true } }, authorEndUser: true },
  });
  if (!post) throw new Error("El post no existe");

  await requireProjectMember(post.board.projectId);

  const status = await db.query.statuses.findFirst({
    where: and(eq(statuses.id, statusId), eq(statuses.projectId, post.board.projectId)),
  });
  if (!status) throw new Error("Estado inválido para este proyecto");

  await db
    .update(posts)
    .set({ statusId: status.id, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  if (post.statusId !== status.id) {
    dispatchWebhookEvent(post.board.projectId, "post.status_changed", {
      postId: post.id,
      title: post.title,
      previousStatusId: post.statusId,
      status: { id: status.id, name: status.name, category: status.category },
    });
  }

  // First transition to "shipped": close the loop with the people who asked.
  if (status.category === "shipped" && !post.shippedNotifiedAt) {
    await notifyShipped(post.id, post.title, post.board.project, post.authorEndUser?.email);
  }

  const slug = post.board.project.slug;
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/p/${slug}/posts/${postId}`);
  revalidatePath(`/p/${slug}/roadmap`);
}
