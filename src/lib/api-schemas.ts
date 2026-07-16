import { z } from "zod";

import type { boards, endUsers, posts, statuses } from "@/db/schema";

/**
 * Zod schemas + serializers for the public REST API (/api/v1).
 * Field limits mirror the board's own validators so a post is a post no
 * matter which door it came in through.
 */

export const apiEndUserSchema = z.object({
  id: z.union([z.string().min(1).max(255), z.number()]).transform(String),
  email: z.string().max(320).optional(),
  name: z.string().max(200).optional(),
  avatarUrl: z.string().max(2000).optional(),
  company: z.string().max(200).optional(),
  plan: z.string().max(100).optional(),
  mrr: z.coerce.number().min(0).max(10_000_000).optional(),
});

export const apiCreatePostSchema = z.object({
  title: z.string().trim().min(3, "El título necesita al menos 3 caracteres").max(200),
  content: z.string().trim().max(5000).optional(),
  /** Board slug; omit to use the project's first board. */
  board: z.string().optional(),
  /** End user the post is created on behalf of (upserted with its revenue attrs). */
  author: apiEndUserSchema.optional(),
});

export const apiUpdatePostSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    content: z.string().trim().max(5000).nullable().optional(),
    statusId: z.string().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "El body no contiene ningún campo que actualizar",
  });

export const apiVoteSchema = z.object({
  /** End user voting on behalf of (upserted; su mrr alimenta revenue_impact). */
  user: apiEndUserSchema,
});

export const apiListPostsSchema = z.object({
  board: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(["top", "new", "revenue"]).default("top"),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export function serializePost(row: {
  post: typeof posts.$inferSelect;
  board?: Pick<typeof boards.$inferSelect, "slug" | "name"> | null;
  status?: typeof statuses.$inferSelect | null;
  author?: typeof endUsers.$inferSelect | null;
}) {
  const { post, board, status, author } = row;
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    board: board ? { slug: board.slug, name: board.name } : null,
    status: status ? { id: status.id, name: status.name, category: status.category } : null,
    voteCount: post.voteCount,
    revenueImpact: Number(post.revenueImpact),
    isPinned: post.isPinned,
    author: author
      ? { id: author.externalId, name: author.name, email: author.email }
      : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
