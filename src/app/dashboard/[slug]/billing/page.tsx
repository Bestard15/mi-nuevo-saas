import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getSessionUserId, isProjectMember } from "@/lib/authz";
import { getProjectOrganization, PLANS, type BillingPlan } from "@/lib/billing";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLAN_ORDER: BillingPlan[] = ["free", "starter", "growth"];

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { slug } = await params;
  const { checkout } = await searchParams;

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) notFound();
  if (!(await isProjectMember(project.id, userId))) notFound();

  const org = await getProjectOrganization(project.id);
  if (!org) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <Link
          href={`/dashboard/${slug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Facturación</h1>
          <Badge variant="secondary" data-testid="current-plan">
            Plan {PLANS[org.plan].name}
          </Badge>
          {org.planRenewsAt ? (
            <span className="text-sm text-muted-foreground">
              Renueva el {org.planRenewsAt.toLocaleDateString("es-ES")}
            </span>
          ) : null}
        </div>
      </header>

      {checkout === "success" ? (
        <p className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
          ¡Pago completado! Tu plan se activará en cuanto Stripe confirme la suscripción
          (unos segundos).
        </p>
      ) : null}
      {checkout === "cancelled" ? (
        <p className="mt-4 rounded-lg border p-3 text-sm text-muted-foreground">
          Checkout cancelado — sigues en tu plan actual.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = org.plan === planKey;
          return (
            <Card
              key={planKey}
              className={cn("flex flex-col", planKey === "starter" && "border-primary shadow-md")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {planKey === "starter" ? <Badge>Popular</Badge> : null}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-sm">/mes</span> — precio plano, sin tracked users
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plan actual
                    </Button>
                  ) : planKey === "free" ? (
                    <p className="text-center text-xs text-muted-foreground">
                      Cancela desde el portal de cliente para volver a Free.
                    </p>
                  ) : (
                    <ActionForm
                      action={createCheckoutSession.bind(null, org.id, slug, planKey)}
                      className="flex flex-col gap-2"
                    >
                      <Button type="submit" className="w-full">
                        Mejorar a {plan.name}
                      </Button>
                    </ActionForm>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Portal de cliente</CardTitle>
          <CardDescription>
            Cambia de plan, actualiza la tarjeta, descarga facturas o cancela cuando quieras —
            sin escribir a soporte. (Sí, es una indirecta a cierta competencia.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createPortalSession.bind(null, org.id, slug)}
            className="flex flex-col gap-2"
          >
            <Button type="submit" variant="outline" className="self-start">
              Gestionar suscripción
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </main>
  );
}
