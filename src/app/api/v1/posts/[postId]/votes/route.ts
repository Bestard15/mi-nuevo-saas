import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { boards, endUsers, posts } from "@/db/schema";
import { apiError, authenticateApiRequest } from "@/lib/api-auth";
import { apiVoteSchema } from "@/lib/api-schemas";
import { upsertEndUser } from "@/lib/end-users";
import { addVote, removeVote } from "@/lib/votes-core";
import { dispatchWebhookEvent } from "@/lib/webhooks";

type RouteParams = { params: Promise<{ postId: string }> };

async function loadProjectPost(projectId: string, postId: string) {
  const row = await db
    .select({ post: posts, board: boards })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(and(eq(posts.id, postId), eq(boards.projectId, projectId)))
    .limit(1);
  return row[0] ?? null;
}

async function parseVoteBody(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  const parsed = apiVoteSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/**
 * POST /api/v1/posts/{id}/votes  body: { user: { id, mrr?, ... } }
 * Votes on behalf of an end user. The user is upserted with its revenue
 * attributes and the vote snapshots their MRR into the post's
 * revenue_impact — same invariant as the board and the widget.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const { postId } = await params;
  const row = await loadProjectPost(auth.project.id, postId);
  if (!row) return apiError(404, "Post no encontrado");

  const data = await parseVoteBody(request);
  if (!data) return apiError(400, "Body inválido: se espera { user: { id, ... } }");

  const endUser = await upsertEndUser(auth.project.id, data.user);
  const result = await addVote(postId, { endUserId: endUser.id }, endUser.mrr);

  if (result.added) {
    dispatchWebhookEvent(auth.project.id, "post.voted", {
      postId,
      postTitle: row.post.title,
      action: "added",
      voteCount: result.voteCount,
      revenueImpact: result.revenueImpact,
      endUserExternalId: endUser.externalId,
    });
    revalidatePath(`/p/${auth.project.slug}`);
    revalidatePath(`/embed/${auth.project.slug}`);
  }

  return NextResponse.json(
    {
      data: {
        postId,
        voted: result.added,
        alreadyVoted: !result.added,
        voteCount: result.voteCount,
        revenueImpact: Number(result.revenueImpact),
      },
    },
    { status: result.added ? 201 : 200 }
  );
}

/**
 * DELETE /api/v1/posts/{id}/votes  body: { user: { id } }
 * Removes the end user's vote, subtracting exactly the MRR snapshot the
 * vote added when it was cast.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const { postId } = await params;
  const row = await loadProjectPost(auth.project.id, postId);
  if (!row) return apiError(404, "Post no encontrado");

  const data = await parseVoteBody(request);
  if (!data) return apiError(400, "Body inválido: se espera { user: { id } }");

  const endUser = await db.query.endUsers.findFirst({
    where: and(
      eq(endUsers.projectId, auth.project.id),
      eq(endUsers.externalId, data.user.id)
    ),
  });
  if (!endUser) return apiError(404, "End user no encontrado");

  const result = await removeVote(postId, { endUserId: endUser.id });

  if (result.removed) {
    dispatchWebhookEvent(auth.project.id, "post.voted", {
      postId,
      postTitle: row.post.title,
      action: "removed",
      voteCount: result.voteCount,
      revenueImpact: result.revenueImpact,
      endUserExternalId: endUser.externalId,
    });
    revalidatePath(`/p/${auth.project.slug}`);
    revalidatePath(`/embed/${auth.project.slug}`);
  }

  return NextResponse.json({
    data: {
      postId,
      removed: result.removed,
      voteCount: result.voteCount,
      revenueImpact: Number(result.revenueImpact),
    },
  });
}
