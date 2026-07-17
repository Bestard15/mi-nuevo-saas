"use client";

import { ChevronUp, Loader2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { toggleVote } from "@/actions/votes";
import { cn } from "@/lib/utils";

/**
 * Optimistic vote toggle: the count and pressed state flip instantly on
 * click; the server action runs inside the same transition, so if it fails
 * (or on revalidation) React reconciles back to the server truth. While the
 * vote commits, the chevron becomes a spinner and re-clicks are ignored —
 * fast fingers can't double-vote.
 */
export function VoteButton({
  postId,
  count,
  hasVoted,
  size = "sm",
}: {
  postId: string;
  count: number;
  hasVoted: boolean;
  size?: "sm" | "lg";
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count, hasVoted },
    (_state, next: { count: number; hasVoted: boolean }) => next
  );

  const vote = () => {
    if (pending) return;
    startTransition(async () => {
      setOptimistic({
        count: Math.max(optimistic.count + (optimistic.hasVoted ? -1 : 1), 0),
        hasVoted: !optimistic.hasVoted,
      });
      try {
        await toggleVote(postId);
      } catch {
        // Boards privados / sesión caducada: el optimista se revierte solo
        // al terminar la transición — sin pantallazo de error.
      }
    });
  };

  return (
    <button
      type="button"
      onClick={vote}
      disabled={pending}
      aria-pressed={optimistic.hasVoted}
      aria-busy={pending}
      title={optimistic.hasVoted ? "Quitar voto" : "Votar"}
      className={cn(
        "flex flex-col items-center rounded-lg border bg-background transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "disabled:pointer-events-none",
        "hover:-translate-y-px hover:border-ring/40 hover:shadow-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
        "active:translate-y-0 active:scale-[0.98]",
        size === "lg" ? "min-w-16 px-3 py-2.5 text-base" : "min-w-12 px-2 py-1.5 text-sm",
        optimistic.hasVoted && "border-primary/60 bg-accent text-primary shadow-soft"
      )}
    >
      {pending ? (
        <Loader2 className={cn("animate-spin", size === "lg" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
      ) : (
        <ChevronUp className={cn(size === "lg" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
      )}
      <span className="font-mono font-semibold tabular-nums">{optimistic.count}</span>
    </button>
  );
}
