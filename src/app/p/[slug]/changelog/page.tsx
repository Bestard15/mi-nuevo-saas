import { desc, eq, isNotNull, and } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { changelogEntries, projects } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) return {};
  return {
    title: `Changelog de ${project.name} | Echoboard`,
    description: `Novedades y lanzamientos de ${project.name}.`,
  };
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) notFound();

  const { canViewPrivate } = await getViewerContext(project.id);
  if (project.isPrivate && !canViewPrivate) notFound();

  const entries = await db.query.changelogEntries.findMany({
    where: and(
      eq(changelogEntries.projectId, project.id),
      isNotNull(changelogEntries.publishedAt)
    ),
    orderBy: [desc(changelogEntries.publishedAt)],
    limit: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Changelog de {project.name}</h1>
          {project.isPrivate ? <Badge variant="outline">Privado</Badge> : null}
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href={`/p/${slug}`} className="hover:underline">
            Feedback
          </Link>
          <Link href={`/p/${slug}/roadmap`} className="hover:underline">
            Roadmap
          </Link>
          <span className="font-medium text-foreground">Changelog</span>
        </nav>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Aún no hay novedades publicadas.
          </p>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="border-b pb-8 last:border-0">
              <time className="text-xs text-muted-foreground">
                {entry.publishedAt?.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <h2 className="mt-1 text-lg font-semibold">{entry.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {entry.body}
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
