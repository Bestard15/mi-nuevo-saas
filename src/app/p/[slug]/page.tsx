import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { posts, projects, statuses, votes } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { resolveEndUser } from "@/lib/viewer";
import { PostCard } from "@/components/board/post-card";
import { SuggestIdeaForm } from "@/components/board/suggest-idea-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  board?: string;
  sort?: string;
  status?: string;
  q?: string;
  created?: string;
}>;
type Params = Promise<{ slug: string }>;

const SORTS = [
  { key: "top", label: "Más votados" },
  { key: "new", label: "Nuevos" },
  { key: "revenue", label: "Por revenue" },
] as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) return {};
  return {
    title: `${project.name} — Feedback | Echoboard`,
    description: `Vota y propón mejoras para ${project.name}.`,
  };
}

export default async function PublicProjectPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { board: boardSlug, sort = "top", status: statusId, q, created } = await searchParams;

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      boards: { orderBy: (b, { asc }) => [asc(b.position), asc(b.createdAt)] },
      statuses: { orderBy: (s, { asc }) => [asc(s.position)] },
    },
  });
  if (!project) notFound();

  const { userId, isMember, canViewPrivate } = await getViewerContext(project.id);
  if (project.isPrivate && !canViewPrivate) notFound();

  const visibleBoards = project.boards.filter((b) => !b.isPrivate || isMember);
  const currentBoard =
    visibleBoards.find((b) => b.slug === boardSlug) ?? visibleBoards[0] ?? null;

  let postRows: {
    post: typeof posts.$inferSelect;
    status: typeof statuses.$inferSelect | null;
    commentCount: number;
  }[] = [];

  if (currentBoard) {
    const conditions = [eq(posts.boardId, currentBoard.id)];
    if (statusId) conditions.push(eq(posts.statusId, statusId));
    if (q) {
      const search = or(ilike(posts.title, `%${q}%`), ilike(posts.content, `%${q}%`));
      if (search) conditions.push(search);
    }

    const orderBy =
      sort === "new"
        ? [desc(posts.isPinned), desc(posts.createdAt)]
        : sort === "revenue"
          ? [desc(posts.isPinned), desc(posts.revenueImpact), desc(posts.voteCount)]
          : [desc(posts.isPinned), desc(posts.voteCount), desc(posts.createdAt)];

    postRows = await db
      .select({
        post: posts,
        status: statuses,
        commentCount:
          sql`(select count(*) from "comment" c where c."post_id" = ${posts.id})`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(statuses, eq(posts.statusId, statuses.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(100);
  }

  // Which of the listed posts has the current viewer voted for?
  const postIds = postRows.map((r) => r.post.id);
  let votedIds = new Set<string>();
  if (postIds.length > 0) {
    // Same identity rule as the vote action: members vote with their user
    // account; everyone else (incl. signed-in non-members) as an end user.
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

  const baseParams = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { board: currentBoard?.slug, sort, status: statusId, q, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) sp.set(key, value);
    }
    const qs = sp.toString();
    return qs ? `/p/${slug}?${qs}` : `/p/${slug}`;
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.isPrivate ? <Badge variant="outline">Privado</Badge> : null}
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Feedback</span>
          <Link href={`/p/${slug}/roadmap`} className="hover:underline">
            Roadmap
          </Link>
          <Link href={`/p/${slug}/changelog`} className="hover:underline">
            Changelog
          </Link>
          {isMember ? (
            <Link href={`/dashboard/${slug}`} className="hover:underline">
              Dashboard
            </Link>
          ) : null}
        </nav>
      </header>

      {visibleBoards.length > 1 ? (
        <nav className="mt-6 flex flex-wrap gap-2">
          {visibleBoards.map((b) => (
            <Link
              key={b.id}
              href={baseParams({ board: b.slug, status: undefined, q: undefined })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm hover:bg-accent",
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
          {currentBoard.description ? (
            <p className="mt-4 text-sm text-muted-foreground">{currentBoard.description}</p>
          ) : null}

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
            <section className="order-2 md:order-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1">
                  {SORTS.map((s) => (
                    <Link
                      key={s.key}
                      href={baseParams({ sort: s.key })}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-accent",
                        sort === s.key && "bg-secondary font-medium text-foreground"
                      )}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
                <form method="GET" className="flex items-center gap-2">
                  {currentBoard.slug ? (
                    <input type="hidden" name="board" value={currentBoard.slug} />
                  ) : null}
                  <input type="hidden" name="sort" value={sort} />
                  <Input
                    type="search"
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="Buscar posts…"
                    className="h-8 w-44"
                  />
                </form>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link
                  href={baseParams({ status: undefined })}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent",
                    !statusId && "bg-secondary font-medium"
                  )}
                >
                  Todos
                </Link>
                {project.statuses.map((s) => (
                  <Link
                    key={s.id}
                    href={baseParams({ status: s.id })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent",
                      statusId === s.id && "bg-secondary font-medium"
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {postRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {q || statusId
                      ? "No hay posts que coincidan con el filtro."
                      : "Aún no hay posts. ¡Sé quien proponga la primera idea!"}
                  </p>
                ) : (
                  postRows.map(({ post, status, commentCount }) => (
                    <PostCard
                      key={post.id}
                      projectSlug={slug}
                      showRevenue={isMember}
                      highlight={post.id === created}
                      post={{
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        voteCount: post.voteCount,
                        revenueImpact: post.revenueImpact,
                        commentCount,
                        status: status ? { name: status.name, color: status.color } : null,
                        hasVoted: votedIds.has(post.id),
                      }}
                    />
                  ))
                )}
              </div>
            </section>

            <aside className="order-1 md:order-2">
              <SuggestIdeaForm
                boardId={currentBoard.id}
                // Tras publicar, de vuelta al board ordenado por nuevos: el
                // post entra en la lista resaltado (?created= lo marca).
                redirectTo={baseParams({ sort: "new", status: undefined, q: undefined })}
                existingTitles={postRows.map((r) => r.post.title)}
              />
            </aside>
          </div>
        </>
      ) : (
        <p className="mt-8 text-muted-foreground">Este proyecto aún no tiene boards.</p>
      )}
    </main>
  );
}
