import { and, asc, count, desc, eq, gt, sql, sum } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { rotateSsoSecret, setProjectPrivacy } from "@/actions/projects";
import { setPostStatus } from "@/actions/posts";
import { db } from "@/db";
import { boards, endUsers, posts, projects, statuses } from "@/db/schema";
import { getSessionUserId, isProjectMember } from "@/lib/authz";
import { StatusSelect } from "@/components/board/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "revenue", label: "Por revenue" },
  { key: "votes", label: "Por votos" },
  { key: "new", label: "Más nuevos" },
] as const;

export default async function ProjectAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "revenue" } = await searchParams;

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: { statuses: { orderBy: [asc(statuses.position)] } },
  });
  if (!project) notFound();
  if (!(await isProjectMember(project.id, userId))) notFound();

  const orderBy =
    sort === "votes"
      ? [desc(posts.voteCount), desc(posts.revenueImpact)]
      : sort === "new"
        ? [desc(posts.createdAt)]
        : [desc(posts.revenueImpact), desc(posts.voteCount)];

  const rows = await db
    .select({ post: posts, boardName: boards.name, status: statuses })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .leftJoin(statuses, eq(posts.statusId, statuses.id))
    .where(eq(boards.projectId, project.id))
    .orderBy(...orderBy)
    .limit(200);

  const [totals] = await db
    .select({
      postCount: count(posts.id),
      voteTotal: sum(posts.voteCount).mapWith(Number),
      revenueTotal: sum(posts.revenueImpact).mapWith(Number),
    })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(eq(boards.projectId, project.id));

  const [identified] = await db
    .select({ n: count(endUsers.id) })
    .from(endUsers)
    .where(
      and(
        eq(endUsers.projectId, project.id),
        sql`${endUsers.externalId} not like 'anon:%'`
      )
    );

  const [payingIdentified] = await db
    .select({ n: count(endUsers.id) })
    .from(endUsers)
    .where(and(eq(endUsers.projectId, project.id), gt(endUsers.mrr, "0")));

  const ssoUrl = `/api/sso/${project.slug}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tu-echoboard.com";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Todos los proyectos
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.isPrivate ? <Badge variant="outline">Privado</Badge> : <Badge variant="secondary">Público</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/${project.slug}/changelog`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Changelog
          </Link>
          <Link
            href={`/p/${project.slug}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Ver board público →
          </Link>
          <form action={setProjectPrivacy.bind(null, project.id, !project.isPrivate)}>
            <Button type="submit" variant="outline" size="sm">
              {project.isPrivate ? "Hacer público" : "Hacer privado"}
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Posts</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{totals?.postCount ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Votos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{totals?.voteTotal ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">MRR impactado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(totals?.revenueTotal ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Usuarios identificados</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {identified?.n ?? 0}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({payingIdentified?.n ?? 0} de pago)
            </span>
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Priorización de feedback
          </h2>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={`/dashboard/${project.slug}?sort=${s.key}`}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-accent",
                  sort === s.key && "bg-secondary font-medium text-foreground"
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Post</th>
                <th className="px-4 py-2 font-medium">Board</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 text-right font-medium">Votos</th>
                <th className="px-4 py-2 text-right font-medium">MRR impactado</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Aún no hay posts en este proyecto.
                  </td>
                </tr>
              ) : (
                rows.map(({ post, boardName, status }) => (
                  <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="max-w-md px-4 py-2">
                      <Link
                        href={`/p/${project.slug}/posts/${post.id}`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{boardName}</td>
                    <td className="px-4 py-2">
                      <StatusSelect
                        statuses={project.statuses.map((s) => ({ id: s.id, name: s.name }))}
                        currentStatusId={status?.id ?? null}
                        action={setPostStatus.bind(null, post.id)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{post.voteCount}</td>
                    <td
                      className={cn(
                        "px-4 py-2 text-right font-medium tabular-nums",
                        Number(post.revenueImpact) > 0 && "text-green-600 dark:text-green-400"
                      )}
                    >
                      {formatMoney(post.revenueImpact)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identificación de usuarios (SSO)</CardTitle>
            <CardDescription>
              Identifica a tus usuarios con sus atributos de revenue para priorizar por MRR y
              darles acceso a boards privados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-medium">1. Firma un JWT (HS256) en tu backend con este secreto:</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                {project.ssoSecret}
              </pre>
              <form action={rotateSsoSecret.bind(null, project.id)} className="mt-2">
                <Button type="submit" variant="outline" size="sm">
                  Rotar secreto
                </Button>
              </form>
            </div>
            <div>
              <p className="font-medium">2. Payload del token:</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
{`{
  "id": "user_123",        // requerido: id estable en tu sistema
  "email": "ana@acme.com",
  "name": "Ana García",
  "company": "Acme Inc",
  "plan": "growth",
  "mrr": 499               // lo que te paga al mes
}`}
              </pre>
            </div>
            <div>
              <p className="font-medium">3. Envía al usuario a:</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                {`GET ${ssoUrl}?token=<jwt>&redirect=/p/${project.slug}`}
              </pre>
              <p className="mt-2 text-muted-foreground">
                También acepta <code className="font-mono">POST {ssoUrl}</code> con{" "}
                <code className="font-mono">{`{ "token": "<jwt>" }`}</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Widget embebible</CardTitle>
            <CardDescription>
              Pega esto en tu app y tus usuarios votan sin salir de ella. Pesa menos de 30 KB y
              no necesita ningún framework.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
{`<script src="${appUrl}/widget.js" data-project="${project.slug}" defer></script>`}
            </pre>
            <div>
              <p className="font-medium">Con identificación de usuario (mismo JWT del SSO):</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
{`<script src="${appUrl}/widget.js" defer></script>
<script>
  window.addEventListener("load", function () {
    Echoboard.init({ project: "${project.slug}" });
    Echoboard.identify("<jwt>"); // opcional: activa MRR y boards privados
  });
</script>`}
              </pre>
              <p className="mt-2 text-muted-foreground">
                Modo inline: <code className="font-mono">{`Echoboard.init({ project: "${project.slug}", mode: "inline", target: "#feedback" })`}</code>.
                Demo local en <code className="font-mono">/widget-demo.html</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
