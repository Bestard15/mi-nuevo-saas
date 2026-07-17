"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

/**
 * Status transition control for team members. Calls the bound server action
 * inside a transition: the select stays physically disabled and a small
 * spinner replaces the chevron until the move commits.
 */
export function StatusSelect({
  statuses,
  currentStatusId,
  action,
}: {
  statuses: { id: string; name: string }[];
  currentStatusId: string | null;
  action: (statusId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <span className="relative inline-flex items-center">
      <select
        defaultValue={currentStatusId ?? ""}
        disabled={pending}
        aria-busy={pending}
        onChange={(event) => {
          const statusId = event.target.value;
          if (statusId) startTransition(() => action(statusId));
        }}
        className="h-9 rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
      >
        <option value="" disabled>
          Cambiar estado…
        </option>
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2
          aria-hidden
          className="pointer-events-none absolute right-2.5 h-4 w-4 animate-spin text-primary"
        />
      ) : null}
    </span>
  );
}
