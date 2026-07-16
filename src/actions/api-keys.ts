"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { apiKeys, projects } from "@/db/schema";
import { generateApiKey } from "@/lib/apikeys";
import { requireProjectMember } from "@/lib/authz";
import { getProjectOrganization, planAllows } from "@/lib/billing";

export type CreateApiKeyState =
  | { error: string; plainKey?: never }
  | { plainKey: string; error?: never }
  | undefined;

const keyNameSchema = z.string().trim().min(1, "Ponle un nombre a la key").max(100);

async function revalidateApiPage(projectId: string) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (project) revalidatePath(`/dashboard/${project.slug}/api`);
}

/**
 * Creates an API key and returns the plaintext ONCE — only the SHA-256 hash
 * is stored, so this is the caller's only chance to copy it.
 */
export async function createApiKey(
  projectId: string,
  _prev: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  await requireProjectMember(projectId);

  // Gate de plan: la API pública es de Starter en adelante. Las keys ya
  // creadas siguen funcionando tras un downgrade; solo se bloquea crear más.
  const org = await getProjectOrganization(projectId);
  if (!org || !planAllows(org.plan, "api")) {
    return { error: "La API pública requiere el plan Starter o Growth" };
  }

  const parsed = keyNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { plain, prefix, hash } = generateApiKey();
  await db.insert(apiKeys).values({
    projectId,
    name: parsed.data,
    prefix,
    keyHash: hash,
  });

  await revalidateApiPage(projectId);
  return { plainKey: plain };
}

/** Revokes (deletes) an API key; requests using it fail with 401 immediately. */
export async function revokeApiKey(keyId: string): Promise<void> {
  const key = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, keyId) });
  if (!key) return;

  await requireProjectMember(key.projectId);
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.projectId, key.projectId)));

  await revalidateApiPage(key.projectId);
}
