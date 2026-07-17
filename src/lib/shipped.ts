import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { endUsers, posts, votes } from "@/db/schema";
import { sendShippedEmails } from "@/lib/email";

/**
 * Emails everyone who asked for a feature when it ships: end-user voters
 * with an email on file, plus the post's end-user author. Shared by the
 * dashboard status action and the public API's PATCH.
 *
 * Callers gate on `status.category === "shipped" && !post.shippedNotifiedAt`;
 * this marks the post as notified regardless of send outcome so status
 * toggling never spams voters — a failed provider call is logged, not
 * retried onto users.
 */
export async function notifyShipped(
  postId: string,
  postTitle: string,
  project: { name: string; slug: string },
  authorEmail: string | null | undefined
): Promise<void> {
  const voterRows = await db
    .select({ email: endUsers.email })
    .from(votes)
    .innerJoin(endUsers, eq(votes.endUserId, endUsers.id))
    .where(and(eq(votes.postId, postId), isNotNull(endUsers.email)));

  const recipients = voterRows
    .map((r) => r.email)
    .filter((e): e is string => Boolean(e));
  if (authorEmail) recipients.push(authorEmail);

  await sendShippedEmails({
    projectName: project.name,
    projectSlug: project.slug,
    postTitle,
    postId,
    recipients,
  });

  await db
    .update(posts)
    .set({ shippedNotifiedAt: new Date() })
    .where(eq(posts.id, postId));
}
