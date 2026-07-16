import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(200),
  content: z.string().trim().max(5000, "Máximo 5000 caracteres").optional().or(z.literal("")),
});

export const updatePostSchema = createPostSchema;

export const addCommentSchema = z.object({
  body: z.string().trim().min(1, "El comentario no puede estar vacío").max(5000),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}
