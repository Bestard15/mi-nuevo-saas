import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  createChangelogEntry,
  deleteChangelogEntry,
  publishChangelogEntry,
  unpublishChangelogEntry,
  updateChangelogEntry,
} from "@/actions/changelog";
import { db } from "@/db";
import { changelogEntries, projects } from "@/db/schema";
import { getSessionUserId, isProjectMember } from "@/lib/authz";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function ChangelogAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) notFound();
  if (!(await isProjectMember(project.id, userId))) notFound();

  const entries = await db.query.changelogEntries.findMany({
    where: eq(changelogEntries.projectId, project.id),
    orderBy: [desc(changelogEntries.createdAt)],
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/${slug}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Changelog</h1>
        </div>
        <Link
          href={`/p/${slug}/changelog`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Ver changelog público →
        </Link>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Nueva entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createChangelogEntry.bind(null, project.id)}
            className="flex flex-col gap-3"
          >
            <Input name="title" placeholder="Título del lanzamiento" required minLength={3} maxLength={200} />
            <Textarea
              name="body"
              placeholder="Qué habéis lanzado y por qué importa…"
              required
              maxLength={20000}
              rows={4}
            />
            <Button type="submit" className="self-end">
              Guardar borrador
            </Button>
          </ActionForm>
        </CardContent>
      </Card>

      <section className="mt-8 flex flex-col gap-4">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Aún no hay entradas. Crea la primera arriba.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{entry.title}</h2>
                  {entry.publishedAt ? (
                    <Badge variant="secondary">
                      Publicado {entry.publishedAt.toLocaleDateString("es-ES")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Borrador</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.publishedAt ? (
                    <form action={unpublishChangelogEntry.bind(null, entry.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Despublicar
                      </Button>
                    </form>
                  ) : (
                    <form action={publishChangelogEntry.bind(null, entry.id)}>
                      <Button type="submit" size="sm">
                        Publicar
                      </Button>
                    </form>
                  )}
                  <form action={deleteChangelogEntry.bind(null, entry.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {entry.body}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Editar
                </summary>
                <ActionForm
                  action={updateChangelogEntry.bind(null, entry.id)}
                  className="mt-3 flex flex-col gap-2"
                >
                  <Input name="title" defaultValue={entry.title} required minLength={3} maxLength={200} />
                  <Textarea name="body" defaultValue={entry.body} required maxLength={20000} rows={5} />
                  <Button type="submit" size="sm" className="self-start">
                    Guardar cambios
                  </Button>
                </ActionForm>
              </details>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
