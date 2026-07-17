import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { boards, endUsers, posts, statuses } from "@/db/schema";
import { apiError, authenticateApiRequest } from "@/lib/api-auth";
import {
  apiCreatePostSchema,
  apiListPostsSchema,
  serializePost,
} from "@/lib/api-schemas";
import { upsertEndUser } from "@/lib/end-users";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * GET /api/v1/posts?board=&status=&sort=top|new|revenue&limit=&offset=
 * Lists the project's posts with their revenue aggregates.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const parsed = apiListPostsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? "Parámetros inválidos");
  }
  const { board: boardSlug, status: statusId, sort, limit, offset } = parsed.data;

  const conditions = [eq(boards.projectId, auth.project.id)];
  if (boardSlug) conditions.push(eq(boards.slug, boardSlug));
  if (statusId) conditions.push(eq(posts.statusId, statusId));

  const orderBy =
    sort === "new"
      ? [desc(posts.createdAt)]
      : sort === "revenue"
        ? [desc(posts.revenueImpact), desc(posts.voteCount)]
        : [desc(posts.voteCount), desc(posts.createdAt)];

  const rows = await db
    .select({ post: posts, board: boards, status: statuses, author: endUsers })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .leftJoin(statuses, eq(posts.statusId, statuses.id))
    .leftJoin(endUsers, eq(posts.authorEndUserId, endUsers.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    data: rows.map(serializePost),
    pagination: { limit, offset, count: rows.length },
  });
}

/**
 * POST /api/v1/posts — creates a post, optionally on behalf of an end user
 * (author is upserted with its revenue attributes, like the SSO identify).
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON inválido");
  }
  const parsed = apiCreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? "Body inválido");
  }

  const board = await db.query.boards.findFirst({
    where: parsed.data.board
      ? and(eq(boards.projectId, auth.project.id), eq(boards.slug, parsed.data.board))
      : eq(boards.projectId, auth.project.id),
    orderBy: [asc(boards.position), asc(boards.createdAt)],
  });
  if (!board) {
    return apiError(404, parsed.data.board ? "Board no encontrado" : "El proyecto no tiene boards");
  }

  const defaultStatus = await db.query.statuses.findFirst({
    where: and(eq(statuses.projectId, auth.project.id), eq(statuses.isDefault, true)),
  });

  const author = parsed.data.author
    ? await upsertEndUser(auth.project.id, parsed.data.author)
    : null;

  const [post] = await db
    .insert(posts)
    .values({
      boardId: board.id,
      title: parsed.data.title,
      content: parsed.data.content || null,
      statusId: defaultStatus?.id ?? null,
      authorEndUserId: author?.id ?? null,
    })
    .returning();

  dispatchWebhookEvent(auth.project.id, "post.created", {
    postId: post.id,
    title: post.title,
    content: post.content,
    boardSlug: board.slug,
    status: defaultStatus ? { id: defaultStatus.id, name: defaultStatus.name } : null,
    authorEndUserExternalId: author?.externalId ?? null,
    source: "api",
  });

  revalidatePath(`/p/${auth.project.slug}`);
  revalidatePath(`/embed/${auth.project.slug}`);

  return NextResponse.json(
    { data: serializePost({ post, board, status: defaultStatus ?? null, author }) },
    { status: 201 }
  );
}
