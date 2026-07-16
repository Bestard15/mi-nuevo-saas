import { createProject } from "@/actions/projects";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CreateProjectForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crear un proyecto</CardTitle>
        <CardDescription>
          Se crea con un board de feedback y los estados por defecto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm action={createProject} className="flex gap-2">
          <Input name="name" placeholder="Nombre del producto" required minLength={2} maxLength={60} />
          <Button type="submit">Crear</Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
