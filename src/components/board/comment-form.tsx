import { addComment } from "@/actions/comments";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={addComment.bind(null, postId)} className="flex flex-col gap-2">
      <label htmlFor="comment-body" className="text-sm font-medium">
        Añade tu comentario
      </label>
      <Textarea
        id="comment-body"
        name="body"
        placeholder="Cuenta tu caso: ¿por qué te importa esta idea?"
        required
        maxLength={5000}
        rows={3}
      />
      <SubmitButton variant="secondary" size="sm" className="self-end" pendingText="Publicando…">
        Comentar
      </SubmitButton>
    </ActionForm>
  );
}
