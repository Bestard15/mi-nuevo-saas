"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { resolveOrCreateEndUser } from "@/lib/viewer";
import { addVote, removeVote, type Voter } from "@/lib/votes-core";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * Toggles the current viewer's vote on a post. The snapshot/aggregate
 * invariant lives in lib/votes-core (shared with the public API): votes
 * store an mrr_snapshot and the post's vote_count / revenue_impact move
 * atomically with the vote row.
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
  let voter: Voter;
  let mrrSnapshot = "0";
  let voterExternalId: string | null = null;
  if (isMember && userId) {
    voter = { userId };
  } else {
    const endUser = await resolveOrCreateEndUser(project.id);
    voter = { endUserId: endUser.id };
    mrrSnapshot = endUser.mrr;
    voterExternalId = endUser.externalId;
  }

  const removal = await removeVote(postId, voter);
  const result = removal.removed ? removal : await addVote(postId, voter, mrrSnapshot);

  dispatchWebhookEvent(project.id, "post.voted", {
    postId,
    postTitle: post.title,
    action: removal.removed ? "removed" : "added",
    voteCount: result.voteCount,
    revenueImpact: result.revenueImpact,
    endUserExternalId: voterExternalId,
  });

  revalidatePath(`/p/${project.slug}`);
  revalidatePath(`/p/${project.slug}/posts/${postId}`);
  revalidatePath(`/embed/${project.slug}`);
}
