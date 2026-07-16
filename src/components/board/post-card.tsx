import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { StatusBadge } from "@/components/board/status-badge";
import { VoteButton } from "@/components/board/vote-button";
import { formatMoney } from "@/lib/utils";

export type PostCardData = {
  id: string;
  title: string;
  content: string | null;
  voteCount: number;
  revenueImpact: string;
  commentCount: number;
  status: { name: string; color: string } | null;
  hasVoted: boolean;
};

export function PostCard({
  post,
  projectSlug,
  showRevenue,
}: {
  post: PostCardData;
  projectSlug: string;
  showRevenue: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <VoteButton postId={post.id} count={post.voteCount} hasVoted={post.hasVoted} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/p/${projectSlug}/posts/${post.id}`}
          className="font-medium hover:underline"
        >
          {post.title}
        </Link>
        {post.content ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {post.status ? <StatusBadge name={post.status.name} color={post.status.color} /> : null}
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
          {showRevenue && Number(post.revenueImpact) > 0 ? (
            <span className="font-medium text-foreground">
              {formatMoney(post.revenueImpact)} MRR impactado
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
