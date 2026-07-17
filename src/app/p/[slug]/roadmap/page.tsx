import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { boards, posts, projects, statuses } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { cn, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Categories that make up the public roadmap, in column order.
const ROADMAP_CATEGORIES = ["planned", "in_progress", "shipped"] as const;

const COLUMN_TAGLINES: Record<(typeof ROADMAP_CATEGORIES)[number], string> = {
  planned: "Comprometido, aún sin empezar",
  in_progress: "Manos a la obra ahora mismo",
  shipped: "Ya en tus manos",
};

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
        <div>
          <p className="eyebrow">Roadmap público</p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-display text-3xl font-medium tracking-[-0.02em]">
              {project.name}
            </h1>
            {project.isPrivate ? <Badge variant="outline">Privado</Badge> : null}
          </div>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link
            href={`/p/${slug}`}
            className="transition-colors duration-150 hover:text-foreground"
          >
            Feedback
          </Link>
          <span className="font-medium text-foreground">Roadmap</span>
          <Link
            href={`/p/${slug}/changelog`}
            className="transition-colors duration-150 hover:text-foreground"
          >
            Changelog
          </Link>
          {isMember ? (
            <Link
              href={`/dashboard/${slug}`}
              className="transition-colors duration-150 hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : null}
        </nav>
      </header>

      <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {columns.map((status, columnIndex) => {
          const items = byStatus.get(status.id) ?? [];
          return (
            <section
              key={status.id}
              className={cn("rise min-w-0", `rise-${columnIndex + 1}`)}
              data-column={status.category}
            >
              {/* Cabecera de columna: hairline, punto de tinta y conteo en mono */}
              <div className="border-b border-border/70 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                  <span className="ml-auto font-mono text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {COLUMN_TAGLINES[status.category as (typeof ROADMAP_CATEGORIES)[number]]}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
                    Nada por aquí todavía.
                    <br />
                    El equipo está tramando algo.
                  </p>
                ) : (
                  items.map((post) => (
                    <Link
                      key={post.id}
                      href={`/p/${slug}/posts/${post.id}`}
                      className={cn(
                        "group block rounded-xl border bg-card p-4 shadow-soft",
                        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        "hover:-translate-y-0.5 hover:border-ring/30 hover:shadow-lift",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        "active:translate-y-0 active:scale-[0.99]"
                      )}
                    >
                      <p className="font-medium leading-snug transition-colors duration-150 group-hover:text-primary">
                        {post.title}
                      </p>
                      <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          ▲ {post.voteCount}
                        </span>
                        {isMember && Number(post.revenueImpact) > 0 ? (
                          <span className="font-mono font-medium tabular-nums text-revenue">
                            {formatMoney(post.revenueImpact)} MRR
                          </span>
                        ) : null}
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
