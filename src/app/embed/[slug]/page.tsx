import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { posts, projects, statuses, votes } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { resolveEndUser } from "@/lib/viewer";
import { NewPostForm } from "@/components/board/new-post-form";
import { VoteButton } from "@/components/board/vote-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback",
  robots: { index: false }, // embed views shouldn't compete with /p/{slug} in search
};

/**
 * Compact board view rendered inside the widget's iframe (~400px wide).
 * Same data and access rules as /p/{slug}, minus the chrome: no big header,
 * no sidebar — a collapsible "suggest" form, the post list, and a footer
 * linking to the full board.
 */
export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ board?: string }>;
}) {
  const { slug } = await params;
  const { board: boardSlug } = await searchParams;

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      boards: { orderBy: (b, { asc }) => [asc(b.position), asc(b.createdAt)] },
    },
  });
  if (!project) notFound();

  const { userId, isMember, ssoEndUser, canViewPrivate } = await getViewerContext(project.id);
  if (project.isPrivate && !canViewPrivate) notFound();

  const visibleBoards = project.boards.filter((b) => !b.isPrivate || canViewPrivate);
  const currentBoard =
    visibleBoards.find((b) => b.slug === boardSlug) ?? visibleBoards[0] ?? null;

  let postRows: {
    post: typeof posts.$inferSelect;
    status: typeof statuses.$inferSelect | null;
    commentCount: number;
  }[] = [];
  if (currentBoard) {
    postRows = await db
      .select({
        post: posts,
        status: statuses,
        commentCount:
          sql`(select count(*) from "comment" c where c."post_id" = ${posts.id})`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(statuses, eq(posts.statusId, statuses.id))
      .where(eq(posts.boardId, currentBoard.id))
      .orderBy(desc(posts.isPinned), desc(posts.voteCount), desc(posts.createdAt))
      .limit(50);
  }

  // Same identity rule as toggleVote: members vote as users, the rest as end users.
  const postIds = postRows.map((r) => r.post.id);
  let votedIds = new Set<string>();
  if (postIds.length > 0) {
    if (isMember && userId) {
      const rows = await db
        .select({ postId: votes.postId })
        .from(votes)
        .where(and(inArray(votes.postId, postIds), eq(votes.userId, userId)));
      votedIds = new Set(rows.map((r) => r.postId));
    } else {
      const endUser = await resolveEndUser(project.id);
      if (endUser) {
        const rows = await db
          .select({ postId: votes.postId })
          .from(votes)
          .where(and(inArray(votes.postId, postIds), eq(votes.endUserId, endUser.id)));
        votedIds = new Set(rows.map((r) => r.postId));
      }
    }
  }

  const embedPath = (board?: string) =>
    board ? `/embed/${slug}?board=${encodeURIComponent(board)}` : `/embed/${slug}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-base font-bold">{project.name}</h1>
        {ssoEndUser?.name ? (
          <span
            className="max-w-40 truncate rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
            data-testid="embed-identity"
          >
            {ssoEndUser.name}
          </span>
        ) : null}
      </header>

      {visibleBoards.length > 1 ? (
        <nav className="mt-3 flex flex-wrap gap-1.5">
          {visibleBoards.map((b) => (
            <Link
              key={b.id}
              href={embedPath(b.slug)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs hover:bg-accent",
                currentBoard?.id === b.id && "bg-secondary font-medium"
              )}
            >
              {b.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {currentBoard ? (
        <>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
              + Sugerir una idea
            </summary>
            <div className="mt-2">
              <NewPostForm boardId={currentBoard.id} redirectTo={embedPath(currentBoard.slug)} />
            </div>
          </details>

          <div className="mt-3 flex flex-col gap-2">
            {postRows.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aún no hay posts. ¡Sé quien proponga la primera idea!
              </p>
            ) : (
              postRows.map(({ post, status, commentCount }) => (
                <article
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <VoteButton
                    postId={post.id}
                    count={post.voteCount}
                    hasVoted={votedIds.has(post.id)}
                  />
                  <div className="min-w-0">
                    <a
                      href={`/p/${slug}/posts/${post.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {post.title}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {status ? (
                        <span className="inline-flex items-center gap-1">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </span>
                      ) : null}
                      {commentCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" aria-hidden />
                          {commentCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Este proyecto aún no tiene boards.
        </p>
      )}

      <footer className="mt-auto pt-4 text-center">
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:underline"
        >
          Ver board completo · Con ⚡ por Echoboard
        </a>
      </footer>
    </main>
  );
}
