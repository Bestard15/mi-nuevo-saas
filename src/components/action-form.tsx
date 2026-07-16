"use client";

import { useActionState } from "react";

export type ActionState = { error: string } | undefined;

/**
 * Thin wrapper over useActionState for server-action forms: disables inputs
 * while pending and renders the returned validation error, if any.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
