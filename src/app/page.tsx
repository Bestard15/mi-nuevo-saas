import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import Link from "next/link";

import { PLANS, type BillingPlan } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Echoboard — Prioriza tu roadmap por MRR real, no por votos",
  description:
    "Feedback boards con priorización por revenue: identifica a tus usuarios con su MRR y decide qué construir según el dinero que lo respalda. Como Canny, pero con precio plano.",
};

const PLAN_ORDER: BillingPlan[] = ["free", "starter", "growth"];

/** Mini board estático para el hero: la propuesta de valor, enseñada. */
const HERO_POSTS = [
  { title: "Exportar informes a CSV", votes: 12, mrr: 4830, status: "Planificado", color: "#8b5cf6" },
  { title: "SSO con SAML para enterprise", votes: 5, mrr: 3980, status: "Abierto", color: "#6b7280" },
  { title: "Modo oscuro", votes: 41, mrr: 214, status: "Abierto", color: "#6b7280" },
] as const;

const COMPARISON = [
  {
    them: "Precio por «tracked user»: tu factura crece con tu producto",
    us: "Precio plano: $0, $19 o $49. Punto.",
  },
  {
    them: "Boards privados solo en planes enterprise",
    us: "Boards privados en todos los planes, incluido Free",
  },
  {
    them: "Prioriza por votos: gana el feedback más ruidoso",
    us: "Prioriza por MRR real: gana el feedback que paga las nóminas",
  },
  {
    them: "Cancelar requiere escribir a soporte",
    us: "Portal de cliente self-service: cambia o cancela en dos clics",
  },
] as const;

const FEATURES = [
  {
    title: "Priorización por MRR real",
    body: "Cada voto lleva un snapshot del MRR del votante. Ordena tu backlog por dinero que lo respalda, no por ruido.",
  },
  {
    title: "SDK de identidad (JWT)",
    body: "Tu backend firma un token con id, plan, empresa y MRR del usuario. Un redirect y queda identificado 30 días.",
  },
  {
    title: "Widget embebible < 30 KB",
    body: "Una línea de script, cero dependencias. Tus usuarios votan sin salir de tu app, en popup o inline.",
  },
  {
    title: "Roadmap y changelog públicos",
    body: "Kanban automático con tus estados y changelog editorial. Cuando algo pasa a «Lanzado», avisamos por email a cada votante.",
  },
  {
    title: "API pública + webhooks HMAC",
    body: "Crea posts y votos desde tu backend, y recibe eventos firmados en tiempo real en tu servidor. Estilo Stripe.",
  },
  {
    title: "Boards privados de verdad",
    body: "Solo tu equipo y usuarios identificados por SSO. Los anónimos reciben un 404, no una pantalla de login.",
  },
] as const;

export default function Home() {
  return (
    <main>
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold">Echoboard</span>
        <div className="flex items-center gap-3">
          <Link href="/p/demo" className="text-sm text-muted-foreground hover:underline">
            Demo
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <Badge variant="secondary">La alternativa a Canny con precio plano</Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Prioriza tu roadmap por <span className="text-primary">MRR real</span>, no por votos
          </h1>
          <p className="text-lg text-muted-foreground">
            41 votos de usuarios gratuitos hacen ruido. 5 votos que suman $3.980/mes pagan
            nóminas. Echoboard identifica a tus usuarios con su revenue y ordena tu backlog por
            el dinero que respalda cada petición.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              Empezar gratis
            </Link>
            <Link
              href="/p/demo"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Ver board de demo
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Gratis para siempre en el plan Free · Sin tarjeta · Boards privados incluidos
          </p>
        </div>

        {/* Board preview */}
        <div className="rounded-xl border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Peticiones de features</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground">
              Ordenado por revenue ▾
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {HERO_POSTS.map((post) => (
              <div key={post.title} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex min-w-11 flex-col items-center rounded-md border px-2 py-1 text-sm">
                  <span aria-hidden>▲</span>
                  <span className="font-semibold tabular-nums">{post.votes}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: post.color }}
                    />
                    {post.status}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    post.mrr > 1000 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )}
                >
                  {formatMoney(post.mrr)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            El modo oscuro puede esperar. El CSV de $4.830/mes, no.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">
            Es como Canny, pero del lado de tu margen
          </h2>
          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3">
            {COMPARISON.map((row) => (
              <div key={row.us} className="grid gap-2 rounded-lg border bg-card p-4 sm:grid-cols-2">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                  {row.them}
                </p>
                <p className="flex items-start gap-2 text-sm font-medium">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                  {row.us}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">
          Todo el ciclo del feedback, conectado a tus ingresos
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/30" id="precios">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Precio plano. Sin sorpresas.</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Nunca pagarás más porque tu producto tenga más usuarios.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((planKey) => {
              const plan = PLANS[planKey];
              return (
                <div
                  key={planKey}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card p-6",
                    planKey === "starter" && "border-primary shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {planKey === "starter" ? <Badge>Popular</Badge> : null}
                  </div>
                  <p className="mt-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </p>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={cn(
                      "mt-6",
                      buttonVariants({ variant: planKey === "starter" ? "default" : "outline" })
                    )}
                  >
                    {planKey === "free" ? "Empezar gratis" : `Empezar con ${plan.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Tu próximo sprint debería pagarse solo
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Monta tu board en dos minutos, pega el widget en tu app y descubre cuánto MRR hay
          detrás de cada petición de tu backlog.
        </p>
        <Link href="/login" className={cn("mt-6 inline-flex", buttonVariants({ size: "lg" }))}>
          Crear mi board gratis
        </Link>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Echoboard</span>
          <div className="flex gap-4">
            <Link href="/p/demo" className="hover:underline">Demo</Link>
            <Link href="/login" className="hover:underline">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
