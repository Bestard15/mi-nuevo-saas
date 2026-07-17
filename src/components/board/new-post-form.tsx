import { createPost } from "@/actions/posts";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewPostForm({
  boardId,
  redirectTo,
}: {
  boardId: string;
  /** After creating, go here instead of the post detail (used by the embed). */
  redirectTo?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sugerir una idea</CardTitle>
      </CardHeader>
      <CardContent>
        <ActionForm action={createPost.bind(null, boardId)} className="flex flex-col gap-3">
          {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
          <Input name="title" placeholder="Título corto y accionable" required minLength={3} maxLength={200} />
          <Textarea
            name="content"
            placeholder="Describe el problema o la idea (opcional)"
            maxLength={5000}
            rows={3}
          />
          <Button type="submit" className="self-end">
            Publicar
          </Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
