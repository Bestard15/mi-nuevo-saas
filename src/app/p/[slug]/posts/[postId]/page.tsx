import { and, asc, eq } from "drizzle-orm";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteComment } from "@/actions/comments";
import { deletePost, setPostStatus, updatePost } from "@/actions/posts";
import { db } from "@/db";
import { comments, posts, votes } from "@/db/schema";
import { getViewerContext } from "@/lib/authz";
import { resolveEndUser } from "@/lib/viewer";
import { ActionForm } from "@/components/action-form";
import { CommentForm } from "@/components/board/comment-form";
import { StatusBadge } from "@/components/board/status-badge";
import { StatusSelect } from "@/components/board/status-select";
import { VoteButton } from "@/components/board/vote-button";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Avatar de iniciales con tinta determinista: distinguible sin fotos. */
function Avatar({ name, team }: { name: string; team?: boolean }) {
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold",
        team ? "bg-primary text-primary-foreground" : "text-foreground/80"
      )}
      style={team ? undefined : { backgroundColor: `oklch(0.93 0.045 ${hue})` }}
    >
      {initials}
    </span>
  );
}

function formatCommentDate(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      board: { with: { project: { with: { statuses: true } } } },
      status: true,
      authorEndUser: true,
      authorUser: true,
    },
  });
  if (!post || post.board.project.slug !== slug) notFound();

  const project = post.board.project;
  const { userId, isMember, canViewPrivate } = await getViewerContext(project.id);
  if ((project.isPrivate || post.board.isPrivate) && !canViewPrivate) notFound();

  const commentList = await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    with: { authorEndUser: true, authorUser: true },
    orderBy: [asc(comments.createdAt)],
  });

  let hasVoted = false;
  if (isMember && userId) {
    hasVoted = Boolean(
      await db.query.votes.findFirst({
        where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
      })
    );
  } else {
    const endUser = await resolveEndUser(project.id);
    if (endUser) {
      hasVoted = Boolean(
        await db.query.votes.findFirst({
          where: and(eq(votes.postId, postId), eq(votes.endUserId, endUser.id)),
        })
      );
    }
  }

  const authorName =
    post.authorUser?.name ??
    post.authorEndUser?.name ??
    (post.authorEndUser ? "Anónimo" : "Equipo");
  const isTeamAuthor = Boolean(post.authorUser);

  const sortedStatuses = [...project.statuses].sort((a, b) => a.position - b.position);
  const revenue = Number(post.revenueImpact);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href={`/p/${slug}`}
        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        ← Volver al board
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,1fr)_240px]">
        {/* Columna principal: el post es el protagonista */}
        <article>
          <div className="flex flex-wrap items-center gap-3">
            {post.status ? (
              <StatusBadge name={post.status.name} color={post.status.color} />
            ) : null}
            <span className="text-xs text-muted-foreground">
              {post.board.name} · {post.createdAt.toLocaleDateString("es-ES")}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-2.5">
            <Avatar name={authorName} team={isTeamAuthor} />
            <div className="text-sm">
              <span className="font-medium">{authorName}</span>
              {isTeamAuthor ? (
                <Badge variant="secondary" className="ml-2">
                  Equipo
                </Badge>
              ) : null}
            </div>
          </div>
          {post.content ? (
            <p className="mt-6 max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {post.content}
            </p>
          ) : null}

          {isMember ? (
            <section className="mt-10 rounded-xl border bg-secondary/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Panel del equipo
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusSelect
                  statuses={sortedStatuses.map((s) => ({ id: s.id, name: s.name }))}
                  currentStatusId={post.statusId}
                  action={setPostStatus.bind(null, post.id)}
                />
                <form action={deletePost.bind(null, post.id)}>
                  <SubmitButton variant="destructive" size="sm" pendingText="Eliminando…">
                    Eliminar post
                  </SubmitButton>
                </form>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
                  Editar título / descripción
                </summary>
                <ActionForm
                  action={updatePost.bind(null, post.id)}
                  className="mt-3 flex flex-col gap-2"
                >
                  <label className="sr-only" htmlFor="post-title">
                    Título
                  </label>
                  <Input
                    id="post-title"
                    name="title"
                    defaultValue={post.title}
                    required
                    minLength={3}
                    maxLength={200}
                  />
                  <label className="sr-only" htmlFor="post-content">
                    Descripción
                  </label>
                  <Textarea
                    id="post-content"
                    name="content"
                    defaultValue={post.content ?? ""}
                    maxLength={5000}
                    rows={4}
                  />
                  <SubmitButton size="sm" className="self-start" pendingText="Guardando…">
                    Guardar cambios
                  </SubmitButton>
                </ActionForm>
              </details>
            </section>
          ) : null}

          {/* Comentarios */}
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessagesSquare className="h-4 w-4 text-muted-foreground" aria-hidden />
              Comentarios
              <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
                {commentList.length}
              </span>
            </h2>

            {commentList.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed px-6 py-10 text-center">
                <p className="font-display text-lg font-medium tracking-[-0.01em]">
                  Nadie ha dicho nada todavía
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
                  Rompe el hielo: cuenta tu caso de uso. Al equipo le encanta leer esto.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col">
                {commentList.map((comment, i) => {
                  const name =
                    comment.authorUser?.name ??
                    comment.authorEndUser?.name ??
                    (comment.authorEndUser ? "Anónimo" : "Equipo");
                  return (
                    <div
                      key={comment.id}
                      className={cn("flex gap-3 py-5", i > 0 && "border-t border-border/60")}
                    >
                      <Avatar name={name} team={comment.isTeamReply} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{name}</span>
                          {comment.isTeamReply ? (
                            <Badge variant="secondary">Equipo</Badge>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {formatCommentDate(comment.createdAt)}
                          </span>
                          {isMember ? (
                            <form action={deleteComment.bind(null, comment.id)} className="ml-auto">
                              <button
                                type="submit"
                                className="text-xs text-muted-foreground transition-colors duration-150 hover:text-destructive"
                              >
                                Eliminar
                              </button>
                            </form>
                          ) : null}
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 border-t border-border/60 pt-6">
              <CommentForm postId={post.id} />
            </div>
          </section>
        </article>

        {/* Tarjeta de impacto: el núcleo del negocio, siempre a la vista */}
        <aside className="order-first md:order-none">
          <div className="rounded-2xl border bg-card p-5 shadow-soft md:sticky md:top-6">
            <div className="flex items-center gap-4">
              <VoteButton postId={post.id} count={post.voteCount} hasVoted={hasVoted} size="lg" />
              <div>
                <p className="text-sm font-medium leading-tight">
                  {hasVoted ? "Has votado esta idea" : "¿La quieres? Vótala"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {post.voteCount === 1 ? "1 persona la respalda" : `${post.voteCount} personas la respaldan`}
                </p>
              </div>
            </div>
            {isMember ? (
              <div className="mt-4 border-t border-border/70 pt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  MRR impactado
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-2xl font-semibold tabular-nums",
                    revenue > 0 ? "text-revenue" : "text-muted-foreground/70"
                  )}
                >
                  {formatMoney(post.revenueImpact)}
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Cada voto suma el MRR de quien lo emite.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
