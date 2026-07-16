import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { boards } from "@/db/schema";
import { authenticateApiRequest } from "@/lib/api-auth";

/** GET /api/v1/boards — boards of the project the API key belongs to. */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const rows = await db.query.boards.findMany({
    where: eq(boards.projectId, auth.project.id),
    orderBy: [asc(boards.position), asc(boards.createdAt)],
  });

  return NextResponse.json({
    data: rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      isPrivate: b.isPrivate,
    })),
  });
}
