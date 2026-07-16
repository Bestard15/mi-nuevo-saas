import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { posts, statuses } from "@/db/schema";
import { apiError, authenticateApiRequest } from "@/lib/api-auth";
import { apiUpdatePostSchema, serializePost } from "@/lib/api-schemas";
import { notifyShipped } from "@/lib/shipped";
import { dispatchWebhookEvent } from "@/lib/webhooks";

type RouteParams = { params: Promise<{ postId: string }> };

/** Loads a post and verifies it belongs to the API key's project (else 404). */
async function loadProjectPost(projectId: string, postId: string) {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: true, status: true, authorEndUser: true },
  });
  if (!post || post.board.projectId !== projectId) return null;
  return post;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const { postId } = await params;
  const post = await loadProjectPost(auth.project.id, postId);
  if (!post) return apiError(404, "Post no encontrado");

  return NextResponse.json({
    data: serializePost({
      post,
      board: post.board,
      status: post.status,
      author: post.authorEndUser,
    }),
  });
}

/**
 * PATCH /api/v1/posts/{id} — title/content/statusId/isPinned. A status
 * change emits post.status_changed and, on the first transition to a
 * shipped-category status, triggers the same voter emails as the dashboard.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const { postId } = await params;
  const post = await loadProjectPost(auth.project.id, postId);
  if (!post) return apiError(404, "Post no encontrado");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON inválido");
  }
  const parsed = apiUpdatePostSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? "Body inválido");
  }

  let newStatus: typeof statuses.$inferSelect | null = null;
  if (parsed.data.statusId !== undefined) {
    newStatus =
      (await db.query.statuses.findFirst({
        where: and(
          eq(statuses.id, parsed.data.statusId),
          eq(statuses.projectId, auth.project.id)
        ),
      })) ?? null;
    if (!newStatus) return apiError(400, "statusId no pertenece a este proyecto");
  }

  const [updated] = await db
    .update(posts)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(newStatus ? { statusId: newStatus.id } : {}),
      ...(parsed.data.isPinned !== undefined ? { isPinned: parsed.data.isPinned } : {}),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, post.id))
    .returning();

  if (newStatus && newStatus.id !== post.statusId) {
    dispatchWebhookEvent(auth.project.id, "post.status_changed", {
      postId: post.id,
      title: updated.title,
      previousStatusId: post.statusId,
      status: { id: newStatus.id, name: newStatus.name, category: newStatus.category },
    });
    if (newStatus.category === "shipped" && !post.shippedNotifiedAt) {
      await notifyShipped(
        post.id,
        updated.title,
        { name: auth.project.name, slug: auth.project.slug },
        post.authorEndUser?.email
      );
    }
  }

  revalidatePath(`/p/${auth.project.slug}`);
  revalidatePath(`/p/${auth.project.slug}/posts/${post.id}`);
  revalidatePath(`/p/${auth.project.slug}/roadmap`);
  revalidatePath(`/embed/${auth.project.slug}`);

  return NextResponse.json({
    data: serializePost({
      post: updated,
      board: post.board,
      status: newStatus ?? post.status,
      author: post.authorEndUser,
    }),
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const { postId } = await params;
  const post = await loadProjectPost(auth.project.id, postId);
  if (!post) return apiError(404, "Post no encontrado");

  await db.delete(posts).where(eq(posts.id, post.id));

  revalidatePath(`/p/${auth.project.slug}`);
  revalidatePath(`/embed/${auth.project.slug}`);

  return NextResponse.json({ data: { id: post.id, deleted: true } });
}
