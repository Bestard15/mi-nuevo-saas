"use client";

import { Lightbulb, Loader2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { createPost, type ActionState } from "@/actions/posts";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Normaliza para comparar títulos: minúsculas, sin tildes, tokens > 2. */
function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length > 2);
}

function findLikelyDuplicate(title: string, existing: string[]): string | null {
  const tokens = tokenize(title);
  if (tokens.length < 2) return null;
  for (const candidate of existing) {
    const other = tokenize(candidate);
    if (other.length === 0) continue;
    const shared = tokens.filter((t) => other.includes(t)).length;
    if (shared / Math.min(tokens.length, other.length) >= 0.6) return candidate;
  }
  return null;
}

/**
 * "Sugerir una idea" con UX viva: pistas de validación mientras se escribe
 * (más contexto, duplicados obvios — sugerencias amables, nunca bloqueos) y
 * una previsualización optimista de la tarjeta mientras el servidor publica.
 * Al volver, el post real entra en la lista con anillo índigo (?created=).
 */
export function SuggestIdeaForm({
  boardId,
  redirectTo,
  existingTitles,
}: {
  boardId: string;
  redirectTo: string;
  existingTitles: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPost.bind(null, boardId),
    undefined
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const hint = useMemo(() => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const duplicate = findLikelyDuplicate(trimmed, existingTitles);
    if (duplicate) {
      return {
        tone: "dup" as const,
        text: `Se parece a «${duplicate}». Si es la misma idea, un voto vale más que un duplicado.`,
      };
    }
    if (trimmed.split(/\s+/).filter(Boolean).length < 3) {
      return {
        tone: "context" as const,
        text: "Un pelín más de contexto ayudará al equipo a entenderla a la primera.",
      };
    }
    return null;
  }, [title, existingTitles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          Sugerir una idea
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <fieldset disabled={pending} className="contents">
            <div>
              <label htmlFor="idea-title" className="sr-only">
                Título de la idea
              </label>
              <Input
                id="idea-title"
                name="title"
                placeholder="Título corto y accionable"
                required
                minLength={3}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-describedby="idea-hint"
              />
              <p
                id="idea-hint"
                aria-live="polite"
                className={cn(
                  "grid text-xs leading-snug transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  hint
                    ? "mt-1.5 grid-rows-[1fr] opacity-100"
                    : "mt-0 grid-rows-[0fr] opacity-0",
                  hint?.tone === "dup" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="overflow-hidden">{hint?.text}</span>
              </p>
            </div>
            <label htmlFor="idea-content" className="sr-only">
              Detalle (opcional)
            </label>
            <Textarea
              id="idea-content"
              name="content"
              placeholder="Describe el problema o la idea (opcional)"
              maxLength={5000}
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <SubmitButton className="self-end" pendingText="Publicando…">
              Publicar
            </SubmitButton>
          </fieldset>
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>

        {/* Previsualización optimista: tu idea, entrando al board */}
        {pending ? (
          <div
            data-testid="optimistic-post"
            className="rise mt-3 rounded-xl border border-primary/30 bg-accent/40 p-3"
          >
            <p className="truncate text-sm font-medium">{title || "Tu idea"}</p>
            {content ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{content}</p>
            ) : null}
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Entrando al board…
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
