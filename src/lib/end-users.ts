import { db } from "@/db";
import { endUsers } from "@/db/schema";

export interface EndUserAttributes {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  company?: string;
  plan?: string;
  mrr?: number;
}

/**
 * Upserts an end user by (projectId, externalId), updating only the
 * attributes actually provided — an identify() or API call that omits a
 * field never wipes data a previous call set. Shared by the SSO endpoint
 * and the public API.
 */
export async function upsertEndUser(projectId: string, attrs: EndUserAttributes) {
  const provided: Partial<typeof endUsers.$inferInsert> = {};
  if (attrs.email !== undefined) provided.email = attrs.email;
  if (attrs.name !== undefined) provided.name = attrs.name;
  if (attrs.avatarUrl !== undefined) provided.avatarUrl = attrs.avatarUrl;
  if (attrs.company !== undefined) provided.company = attrs.company;
  if (attrs.plan !== undefined) provided.plan = attrs.plan;
  if (attrs.mrr !== undefined) provided.mrr = attrs.mrr.toFixed(2);

  const [endUser] = await db
    .insert(endUsers)
    .values({ projectId, externalId: attrs.id, ...provided })
    .onConflictDoUpdate({
      target: [endUsers.projectId, endUsers.externalId],
      // On conflict with nothing to update, refresh externalId (a no-op
      // write) so RETURNING still yields the existing row.
      set: Object.keys(provided).length > 0 ? provided : { externalId: attrs.id },
    })
    .returning();
  return endUser;
}
