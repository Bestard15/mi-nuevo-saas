import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { boards, posts, projects, statuses } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Categories that make up the public roadmap, in column order.
const ROADMAP_CATEGORIES = ["planned", "in_progress", "shipped"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) return {};
  return {
    title: `Roadmap de ${project.name} | Echoboard`,
    description: `Qué está planificado, en progreso y lanzado en ${project.name}.`,
  };
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: { statuses: { orderBy: [asc(statuses.position)] } },
  });
  if (!project) notFound();

  const { isMember, canViewPrivate } = await getViewerContext(project.id);
  if (project.isPrivate && !canViewPrivate) notFound();

  const columns = project.statuses.filter((s) =>
    (ROADMAP_CATEGORIES as readonly string[]).includes(s.category)
  );

  const columnIds = columns.map((c) => c.id);
  const rows =
    columnIds.length === 0
      ? []
      : await db
          .select({ post: posts, boardIsPrivate: boards.isPrivate })
          .from(posts)
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(inArray(posts.statusId, columnIds))
          .orderBy(desc(posts.voteCount), desc(posts.createdAt))
          .limit(300);

  const visible = rows.filter((r) => !r.boardIsPrivate || isMember || canViewPrivate);
  const byStatus = new Map<string, (typeof visible)[number]["post"][]>();
  for (const row of visible) {
    if (!row.post.statusId) continue;
    const list = byStatus.get(row.post.statusId) ?? [];
    list.push(row.post);
    byStatus.set(row.post.statusId, list);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Roadmap de {project.name}</h1>
          {project.isPrivate ? <Badge variant="outline">Privado</Badge> : null}
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href={`/p/${slug}`} className="hover:underline">
            Feedback
          </Link>
          <span className="font-medium text-foreground">Roadmap</span>
          <Link href={`/p/${slug}/changelog`} className="hover:underline">
            Changelog
          </Link>
        </nav>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {columns.map((status) => {
          const items = byStatus.get(status.id) ?? [];
          return (
            <section key={status.id} className="rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Nada por aquí todavía
                  </p>
                ) : (
                  items.map((post) => (
                    <Link
                      key={post.id}
                      href={`/p/${slug}/posts/${post.id}`}
                      className="rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent"
                    >
                      <p className="font-medium leading-snug">{post.title}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        ▲ {post.voteCount} {post.voteCount === 1 ? "voto" : "votos"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
