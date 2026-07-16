"use client";

import { useActionState, useState } from "react";

import { createApiKey, type CreateApiKeyState } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Creates an API key and shows the plaintext exactly once (only its hash is
 * stored server-side), with a copy button.
 */
export function CreateApiKeyForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState<CreateApiKeyState, FormData>(
    createApiKey.bind(null, projectId),
    undefined
  );
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <Input
          name="name"
          placeholder="Nombre de la key (p. ej. «Backend producción»)"
          required
          maxLength={100}
          className="h-9 max-w-xs"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Creando…" : "Crear API key"}
        </Button>
      </form>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      {state?.plainKey ? (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
          data-testid="plain-api-key"
        >
          <p className="text-sm font-medium">
            Copia la key ahora — no volverá a mostrarse:
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">
              {state.plainKey}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(state.plainKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "¡Copiada!" : "Copiar"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
