import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteComment } from "@/actions/comments";
import { deletePost, setPostStatus, updatePost } from "@/actions/posts";
import { db } from "@/db";
import { comments, posts, votes } from "@/db/schema";
import { getSessionUserId, isProjectMember } from "@/lib/authz";
import { findAnonEndUser } from "@/lib/viewer";
import { ActionForm } from "@/components/action-form";
import { CommentForm } from "@/components/board/comment-form";
import { StatusBadge } from "@/components/board/status-badge";
import { StatusSelect } from "@/components/board/status-select";
import { VoteButton } from "@/components/board/vote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  const userId = await getSessionUserId();
  const isMember = userId ? await isProjectMember(project.id, userId) : false;
  if ((project.isPrivate || post.board.isPrivate) && !isMember) notFound();

  const commentList = await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    with: { authorEndUser: true, authorUser: true },
    orderBy: [asc(comments.createdAt)],
  });

  let hasVoted = false;
  if (userId) {
    hasVoted = Boolean(
      await db.query.votes.findFirst({
        where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
      })
    );
  } else {
    const anon = await findAnonEndUser(project.id);
    if (anon) {
      hasVoted = Boolean(
        await db.query.votes.findFirst({
          where: and(eq(votes.postId, postId), eq(votes.endUserId, anon.id)),
        })
      );
    }
  }

  const authorName =
    post.authorUser?.name ??
    post.authorEndUser?.name ??
    (post.authorEndUser ? "Anónimo" : "Equipo");

  const sortedStatuses = [...project.statuses].sort((a, b) => a.position - b.position);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/p/${slug}`} className="text-sm text-muted-foreground hover:underline">
        ← Volver al board
      </Link>

      <article className="mt-4 flex items-start gap-4">
        <VoteButton postId={post.id} count={post.voteCount} hasVoted={hasVoted} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold">{post.title}</h1>
            {post.status ? (
              <StatusBadge name={post.status.name} color={post.status.color} />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Por {authorName} · {post.createdAt.toLocaleDateString("es-ES")}
          </p>
          {post.content ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{post.content}</p>
          ) : null}
          {isMember && Number(post.revenueImpact) > 0 ? (
            <p className="mt-3 text-sm font-medium">
              Impacto en revenue: {formatMoney(post.revenueImpact)} MRR
            </p>
          ) : null}
        </div>
      </article>

      {isMember ? (
        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-4">
          <span className="text-sm font-medium">Equipo:</span>
          <StatusSelect
            statuses={sortedStatuses.map((s) => ({ id: s.id, name: s.name }))}
            currentStatusId={post.statusId}
            action={setPostStatus.bind(null, post.id)}
          />
          <form action={deletePost.bind(null, post.id)}>
            <Button type="submit" variant="destructive" size="sm">
              Eliminar post
            </Button>
          </form>
          <details className="w-full">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Editar título / descripción
            </summary>
            <ActionForm
              action={updatePost.bind(null, post.id)}
              className="mt-3 flex flex-col gap-2"
            >
              <Input name="title" defaultValue={post.title} required minLength={3} maxLength={200} />
              <Textarea name="content" defaultValue={post.content ?? ""} maxLength={5000} rows={4} />
              <Button type="submit" size="sm" className="self-start">
                Guardar cambios
              </Button>
            </ActionForm>
          </details>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Comentarios ({commentList.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {commentList.map((comment) => {
            const name =
              comment.authorUser?.name ??
              comment.authorEndUser?.name ??
              (comment.authorEndUser ? "Anónimo" : "Equipo");
            return (
              <div key={comment.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{name}</span>
                    {comment.isTeamReply ? (
                      <Badge variant="secondary" className="ml-2">
                        Equipo
                      </Badge>
                    ) : null}
                    <span className="ml-2">
                      {comment.createdAt.toLocaleDateString("es-ES")}
                    </span>
                  </p>
                  {isMember ? (
                    <form action={deleteComment.bind(null, comment.id)}>
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Eliminar
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      </section>
    </main>
  );
}
