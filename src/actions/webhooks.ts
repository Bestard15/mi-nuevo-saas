"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { projects, webhookEndpoints } from "@/db/schema";
import { generateWebhookSecret } from "@/lib/apikeys";
import { requireProjectMember } from "@/lib/authz";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/webhooks";

export type ActionState = { error: string } | undefined;

const endpointSchema = z.object({
  url: z
    .string()
    .trim()
    .max(2000, "URL demasiado larga")
    .refine(
      (u) => {
        try {
          const parsed = new URL(u);
          return parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
          return false;
        }
      },
      { message: "La URL no es válida (debe ser http(s))" }
    ),
  events: z.array(z.enum(WEBHOOK_EVENTS)),
});

async function revalidateApiPage(projectId: string) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (project) revalidatePath(`/dashboard/${project.slug}/api`);
}

/**
 * Registers an outbound webhook endpoint with a fresh whsec_ signing secret
 * (shown in the dashboard so the customer can verify our signatures).
 */
export async function createWebhookEndpoint(
  projectId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProjectMember(projectId);

  const parsed = endpointSchema.safeParse({
    url: formData.get("url"),
    events: formData.getAll("events").map(String) as WebhookEvent[],
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(webhookEndpoints).values({
    projectId,
    url: parsed.data.url,
    secret: generateWebhookSecret(),
    events: parsed.data.events, // vacío = todos los eventos
  });

  await revalidateApiPage(projectId);
  return undefined;
}

export async function toggleWebhookEndpoint(endpointId: string): Promise<void> {
  const endpoint = await db.query.webhookEndpoints.findFirst({
    where: eq(webhookEndpoints.id, endpointId),
  });
  if (!endpoint) return;

  await requireProjectMember(endpoint.projectId);
  await db
    .update(webhookEndpoints)
    .set({ isActive: !endpoint.isActive })
    .where(eq(webhookEndpoints.id, endpointId));

  await revalidateApiPage(endpoint.projectId);
}

export async function deleteWebhookEndpoint(endpointId: string): Promise<void> {
  const endpoint = await db.query.webhookEndpoints.findFirst({
    where: eq(webhookEndpoints.id, endpointId),
  });
  if (!endpoint) return;

  await requireProjectMember(endpoint.projectId);
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, endpointId));

  await revalidateApiPage(endpoint.projectId);
}
