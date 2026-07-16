import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { posts, votes } from "@/db/schema";

export type Voter = { endUserId: string; userId?: never } | { userId: string; endUserId?: never };

export interface VoteAggregates {
  voteCount: number;
  revenueImpact: string;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function voterCondition(voter: Voter) {
  return "endUserId" in voter && voter.endUserId
    ? eq(votes.endUserId, voter.endUserId)
    : eq(votes.userId, voter.userId!);
}

async function readAggregates(txOrDb: Tx | typeof db, postId: string): Promise<VoteAggregates> {
  const [post] = await txOrDb
    .select({ voteCount: posts.voteCount, revenueImpact: posts.revenueImpact })
    .from(posts)
    .where(eq(posts.id, postId));
  return post;
}

/**
 * Single source of truth for the revenue-prioritization invariant, shared by
 * the board UI (toggleVote) and the public API: every vote stores an
 * mrr_snapshot, and the post's denormalized aggregates move atomically with
 * the vote row — add exactly the snapshot on vote, subtract exactly that
 * same snapshot on unvote.
 */
export async function addVote(
  postId: string,
  voter: Voter,
  mrrSnapshot: string
): Promise<{ added: boolean } & VoteAggregates> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(votes)
      .values(
        "endUserId" in voter && voter.endUserId
          ? { postId, endUserId: voter.endUserId, mrrSnapshot }
          : { postId, userId: voter.userId!, mrrSnapshot }
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
    return { added: inserted.length > 0, ...(await readAggregates(tx, postId)) };
  });
}

export async function removeVote(
  postId: string,
  voter: Voter
): Promise<{ removed: boolean } & VoteAggregates> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .delete(votes)
      .where(and(eq(votes.postId, postId), voterCondition(voter)))
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
    }
    return { removed: existing.length > 0, ...(await readAggregates(tx, postId)) };
  });
}
