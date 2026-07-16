import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { revokeApiKey } from "@/actions/api-keys";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  toggleWebhookEndpoint,
} from "@/actions/webhooks";
import { db } from "@/db";
import { apiKeys, projects, webhookEndpoints } from "@/db/schema";
import { getSessionUserId, isProjectMember } from "@/lib/authz";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { ActionForm } from "@/components/action-form";
import { CreateApiKeyForm } from "@/components/dashboard/create-api-key-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const EVENT_DESCRIPTIONS: Record<(typeof WEBHOOK_EVENTS)[number], string> = {
  "post.created": "Nuevo post en un board",
  "post.status_changed": "Un post cambia de estado",
  "post.voted": "Voto añadido o retirado (con agregados de revenue)",
  "comment.created": "Nuevo comentario en un post",
};

export default async function ApiSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) notFound();
  if (!(await isProjectMember(project.id, userId))) notFound();

  const [keys, endpoints] = await Promise.all([
    db.query.apiKeys.findMany({
      where: eq(apiKeys.projectId, project.id),
      orderBy: [desc(apiKeys.createdAt)],
    }),
    db.query.webhookEndpoints.findMany({
      where: eq(webhookEndpoints.projectId, project.id),
      orderBy: [desc(webhookEndpoints.createdAt)],
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tu-echoboard.com";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <Link
          href={`/dashboard/${slug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">API y webhooks</h1>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">API keys</CardTitle>
          <CardDescription>
            Autentican la API REST (<code className="font-mono">Authorization: Bearer eb_…</code>).
            Solo se guarda su hash SHA-256: la key se muestra una única vez al crearla.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CreateApiKeyForm projectId={project.id} />

          {keys.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Key</th>
                    <th className="px-3 py-2 font-medium">Último uso</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{key.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {key.prefix}…
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {key.lastUsedAt
                          ? key.lastUsedAt.toLocaleString("es-ES")
                          : "Nunca"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <form action={revokeApiKey.bind(null, key.id)}>
                          <Button type="submit" variant="destructive" size="sm">
                            Revocar
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay keys.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Webhooks salientes</CardTitle>
          <CardDescription>
            Notificamos a tu servidor en tiempo real. Cada entrega va firmada con
            HMAC-SHA256 (<code className="font-mono">X-Echoboard-Signature: t=…,v1=…</code>) usando
            el secreto del endpoint, con 3 reintentos ante fallos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ActionForm
            action={createWebhookEndpoint.bind(null, project.id)}
            className="flex flex-col gap-3 rounded-lg border p-3"
          >
            <Input
              name="url"
              type="url"
              placeholder="https://api.tuapp.com/webhooks/echoboard"
              required
              maxLength={2000}
            />
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <legend className="mb-1 text-xs text-muted-foreground">
                Eventos (ninguno marcado = todos)
              </legend>
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  title={EVENT_DESCRIPTIONS[event]}
                  className="flex items-center gap-1.5"
                >
                  <input type="checkbox" name="events" value={event} />
                  <code className="font-mono text-xs">{event}</code>
                </label>
              ))}
            </fieldset>
            <Button type="submit" size="sm" className="self-start">
              Añadir endpoint
            </Button>
          </ActionForm>

          {endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay endpoints.</p>
          ) : (
            endpoints.map((endpoint) => (
              <div key={endpoint.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <code className="truncate font-mono text-xs">{endpoint.url}</code>
                    {endpoint.isActive ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Pausado</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleWebhookEndpoint.bind(null, endpoint.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        {endpoint.isActive ? "Pausar" : "Reanudar"}
                      </Button>
                    </form>
                    <form action={deleteWebhookEndpoint.bind(null, endpoint.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Eventos:{" "}
                    {endpoint.events.length === 0 ? "todos" : endpoint.events.join(", ")}
                  </span>
                  <span>·</span>
                  <span>
                    Última entrega:{" "}
                    {endpoint.lastAttemptAt
                      ? `${endpoint.lastStatus || "error de red"} — ${endpoint.lastAttemptAt.toLocaleString("es-ES")}`
                      : "ninguna"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Secreto de firma:{" "}
                  <code className="break-all font-mono">{endpoint.secret}</code>
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Referencia rápida</CardTitle>
          <CardDescription>
            Base: <code className="font-mono">{appUrl}/api/v1</code> — todos los endpoints
            requieren <code className="font-mono">Authorization: Bearer &lt;api_key&gt;</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <tbody className="font-mono">
                <tr className="border-b"><td className="px-3 py-1.5">GET /boards</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Boards del proyecto</td></tr>
                <tr className="border-b"><td className="px-3 py-1.5">GET /statuses</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Estados del workflow</td></tr>
                <tr className="border-b"><td className="px-3 py-1.5">GET /posts?sort=revenue</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Posts con agregados de revenue</td></tr>
                <tr className="border-b"><td className="px-3 py-1.5">POST /posts</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Crear post (author opcional con mrr)</td></tr>
                <tr className="border-b"><td className="px-3 py-1.5">GET|PATCH|DELETE /posts/{"{id}"}</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Leer, editar (estado incl.) o borrar</td></tr>
                <tr><td className="px-3 py-1.5">POST|DELETE /posts/{"{id}"}/votes</td><td className="px-3 py-1.5 font-sans text-muted-foreground">Votar / quitar voto en nombre de un usuario</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="font-medium">Ejemplo: votar con atributos de revenue</p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
{`curl -X POST ${appUrl}/api/v1/posts/<postId>/votes \\
  -H "Authorization: Bearer eb_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "user": { "id": "user_123", "email": "ana@acme.com", "mrr": 499 } }'`}
            </pre>
          </div>
          <div>
            <p className="font-medium">Verificar la firma de un webhook (Node.js)</p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
{`const [t, v1] = signature.split(",").map((p) => p.split("=")[1]);
const expected = crypto.createHmac("sha256", WEBHOOK_SECRET)
  .update(\`\${t}.\${rawBody}\`).digest("hex");
const valid = crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  && Math.abs(Date.now() / 1000 - Number(t)) < 300; // tolerancia 5 min`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
