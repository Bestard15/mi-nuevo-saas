import { addComment } from "@/actions/comments";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={addComment.bind(null, postId)} className="flex flex-col gap-2">
      <Textarea name="body" placeholder="Escribe un comentario…" required maxLength={5000} rows={3} />
      <Button type="submit" variant="secondary" className="self-end" size="sm">
        Comentar
      </Button>
    </ActionForm>
  );
}
