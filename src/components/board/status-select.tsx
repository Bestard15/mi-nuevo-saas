"use client";

import { useTransition } from "react";

/**
 * Status transition control for team members. Calls the bound server action
 * inside a transition so the select stays disabled until the move commits.
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
    <select
      defaultValue={currentStatusId ?? ""}
      disabled={pending}
      onChange={(event) => {
        const statusId = event.target.value;
        if (statusId) startTransition(() => action(statusId));
      }}
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
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
  );
}
