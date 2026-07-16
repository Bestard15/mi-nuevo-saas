import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { endUsers, projects } from "@/db/schema";
import {
  SSO_SESSION_TTL_SECONDS,
  signEndUserSession,
  ssoCookieName,
  verifyIdentifyToken,
  type IdentifyPayload,
} from "@/lib/sso";

/**
 * SSO identify endpoint.
 *
 * GET  /api/sso/{projectSlug}?token=<jwt>&redirect=/p/{projectSlug}
 *   Link-based flow: the customer's app sends the user here; we set the
 *   session cookie and redirect to the board.
 *
 * POST /api/sso/{projectSlug}  body: { "token": "<jwt>" }
 *   Programmatic flow (the Fase 4 widget will use this); returns JSON.
 *
 * The token is an HS256 JWT signed with the project's ssoSecret carrying
 * { id, email?, name?, avatarUrl?, company?, plan?, mrr? }.
 */

async function identify(projectSlug: string, token: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, projectSlug),
  });
  if (!project) return { error: "Proyecto no encontrado", status: 404 } as const;

  const payload = await verifyIdentifyToken(token, project.ssoSecret);
  if (!payload) return { error: "Token inválido o expirado", status: 401 } as const;

  const endUser = await upsertEndUser(project.id, payload);
  const session = await signEndUserSession(endUser.id, project.id);
  return { project, endUser, session } as const;
}

async function upsertEndUser(projectId: string, payload: IdentifyPayload) {
  const values = {
    projectId,
    externalId: payload.id,
    email: payload.email ?? null,
    name: payload.name ?? null,
    avatarUrl: payload.avatarUrl ?? null,
    company: payload.company ?? null,
    plan: payload.plan ?? null,
    mrr: payload.mrr !== undefined ? payload.mrr.toFixed(2) : "0",
  };
  const [endUser] = await db
    .insert(endUsers)
    .values(values)
    .onConflictDoUpdate({
      target: [endUsers.projectId, endUsers.externalId],
      set: {
        email: values.email,
        name: values.name,
        avatarUrl: values.avatarUrl,
        company: values.company,
        plan: values.plan,
        mrr: values.mrr,
      },
    })
    .returning();
  return endUser;
}

function setSessionCookie(response: NextResponse, projectId: string, session: string) {
  response.cookies.set(ssoCookieName(projectId), session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SSO_SESSION_TTL_SECONDS,
    path: "/",
  });
}

/** Only same-origin relative redirects — never an open redirect. */
function safeRedirectPath(raw: string | null, fallback: string): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  return fallback;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Falta el parámetro token" }, { status: 400 });
  }

  const result = await identify(slug, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const redirectPath = safeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
    `/p/${slug}`
  );
  const response = NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
  setSessionCookie(response, result.project.id, result.session);
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let token: unknown;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Falta el campo token" }, { status: 400 });
  }

  const result = await identify(slug, token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({
    ok: true,
    endUser: {
      id: result.endUser.id,
      externalId: result.endUser.externalId,
      name: result.endUser.name,
      email: result.endUser.email,
      mrr: result.endUser.mrr,
      plan: result.endUser.plan,
      company: result.endUser.company,
    },
  });
  setSessionCookie(response, result.project.id, result.session);
  return response;
}
