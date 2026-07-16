"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { posts, votes } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { resolveOrCreateEndUser } from "@/lib/viewer";

/**
 * Toggles the current viewer's vote on a post and keeps the post's
 * denormalized aggregates (vote_count, revenue_impact) in sync, atomically.
 *
 * Each vote stores an mrr_snapshot (the voter's MRR at vote time); the
 * post's revenue_impact is the running sum of those snapshots, which is what
 * powers "prioritize by revenue" without any joins at read time.
 */
export async function toggleVote(postId: string): Promise<void> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { board: { with: { project: true } } },
  });
  if (!post) throw new Error("El post no existe");

  const project = post.board.project;
  const { userId, isMember, canViewPrivate } = await getViewerContext(project.id);
  if ((project.isPrivate || post.board.isPrivate) && !canViewPrivate) {
    throw new Error("Este board es privado");
  }

  // Resolve the voter identity: team member (userId) or end user (endUserId).
  let voterColumn: typeof votes.userId | typeof votes.endUserId;
  let voterId: string;
  let mrrSnapshot = "0";
  if (isMember && userId) {
    voterColumn = votes.userId;
    voterId = userId;
  } else {
    const endUser = await resolveOrCreateEndUser(project.id);
    voterColumn = votes.endUserId;
    voterId = endUser.id;
    mrrSnapshot = endUser.mrr;
  }

  await db.transaction(async (tx) => {
    const existing = await tx
      .delete(votes)
      .where(and(eq(votes.postId, postId), eq(voterColumn, voterId)))
      .returning({ mrrSnapshot: votes.mrrSnapshot });

    if (existing.length > 0) {
      // Un-vote: subtract exactly what this vote added when it was cast.
      await tx
        .update(posts)
        .set({
          voteCount: sql`greatest(${posts.voteCount} - 1, 0)`,
          revenueImpact: sql`greatest(${posts.revenueImpact} - cast(${existing[0].mrrSnapshot} as numeric), 0)`,
        })
        .where(eq(posts.id, postId));
      return;
    }

    const inserted = await tx
      .insert(votes)
      .values(
        voterColumn === votes.userId
          ? { postId, userId: voterId, mrrSnapshot }
          : { postId, endUserId: voterId, mrrSnapshot }
      )
      .onConflictDoNothing()
      .returning({ id: votes.id });

    // A concurrent request may have inserted the vote first; only count ours.
    if (inserted.length > 0) {
      await tx
        .update(posts)
        .set({
          voteCount: sql`${posts.voteCount} + 1`,
          revenueImpact: sql`${posts.revenueImpact} + cast(${mrrSnapshot} as numeric)`,
        })
        .where(eq(posts.id, postId));
    }
  });

  revalidatePath(`/p/${project.slug}`);
  revalidatePath(`/p/${project.slug}/posts/${postId}`);
}
