import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { statuses } from "@/db/schema";
import { authenticateApiRequest } from "@/lib/api-auth";

/** GET /api/v1/statuses — workflow statuses of the project. */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) return auth.error;

  const rows = await db.query.statuses.findMany({
    where: eq(statuses.projectId, auth.project.id),
    orderBy: [asc(statuses.position)],
  });

  return NextResponse.json({
    data: rows.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      color: s.color,
      isDefault: s.isDefault,
    })),
  });
}
