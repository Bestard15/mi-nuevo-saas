import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { apiKeys, projects } from "@/db/schema";
import { hashApiKey } from "@/lib/apikeys";

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: { message } }, { status });
}

type AuthResult =
  | { project: typeof projects.$inferSelect; error?: never }
  | { project?: never; error: NextResponse };

/**
 * Authenticates a public-API request via `Authorization: Bearer eb_...`.
 * The key is looked up by hash; a match resolves the project the key is
 * scoped to (all /api/v1 resources are tenant-scoped through it).
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { error: apiError(401, "Falta la cabecera Authorization: Bearer <api_key>") };
  }

  const row = await db
    .select({ key: apiKeys, project: projects })
    .from(apiKeys)
    .innerJoin(projects, eq(apiKeys.projectId, projects.id))
    .where(eq(apiKeys.keyHash, hashApiKey(token)))
    .limit(1);

  if (row.length === 0) {
    return { error: apiError(401, "API key inválida o revocada") };
  }

  // Best-effort usage tracking; never blocks or fails the request.
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row[0].key.id))
    .catch(() => {});

  return { project: row[0].project };
}
