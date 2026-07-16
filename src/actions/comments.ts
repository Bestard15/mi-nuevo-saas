"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { comments, posts } from "@/db/schema";
import { getViewerContext, requireProjectMember } from "@/lib/authz";
import { resolveOrCreateEndUser } from "@/lib/viewer";
import { addCommentSchema, firstIssue } from "@/lib/validators";

export type ActionState = { error: string } | undefined;

/**
 * Adds a comment to a post. Team members are flagged with isTeamReply so the
 * UI can highlight official responses.
 */
export async function addComment(
  postId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = addCommentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: { with: { project: true } } },
  });
  if (!post) return { error: "El post no existe" };

  const project = post.board.project;
  const { userId, isMember, canViewPrivate } = await getViewerContext(project.id);
  if ((project.isPrivate || post.board.isPrivate) && !canViewPrivate) {
    return { error: "Este board es privado" };
  }

  if (isMember && userId) {
    await db.insert(comments).values({
      postId,
      body: parsed.data.body,
      authorUserId: userId,
      isTeamReply: true,
    });
  } else {
    const endUser = await resolveOrCreateEndUser(project.id);
    await db.insert(comments).values({
      postId,
      body: parsed.data.body,
      authorEndUserId: endUser.id,
    });
  }

  revalidatePath(`/p/${project.slug}/posts/${postId}`);
  return undefined;
}

/** Deletes a comment. Members of the project only. */
export async function deleteComment(commentId: string): Promise<void> {
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { post: { with: { board: { with: { project: true } } } } },
  });
  if (!comment) return;

  const project = comment.post.board.project;
  await requireProjectMember(project.id);
  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath(`/p/${project.slug}/posts/${comment.postId}`);
}
