import { ChevronUp } from "lucide-react";

import { toggleVote } from "@/actions/votes";
import { cn } from "@/lib/utils";

/**
 * Server-rendered vote toggle: a one-button form posting to the toggleVote
 * server action. No client JS needed.
 */
export function VoteButton({
  postId,
  count,
  hasVoted,
}: {
  postId: string;
  count: number;
  hasVoted: boolean;
}) {
  return (
    <form action={toggleVote.bind(null, postId)}>
      <button
        type="submit"
        aria-pressed={hasVoted}
        title={hasVoted ? "Quitar voto" : "Votar"}
        className={cn(
          "flex min-w-12 flex-col items-center rounded-md border px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          hasVoted && "border-primary bg-primary/10 text-primary"
        )}
      >
        <ChevronUp className="h-4 w-4" />
        <span className="font-semibold tabular-nums">{count}</span>
      </button>
    </form>
  );
}
