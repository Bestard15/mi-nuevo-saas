import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";

import { PLANS, type BillingPlan } from "@/lib/billing";
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
  { title: "SSO con SAML para enterprise", votes: 5, mrr: 3980, status: "Abierto", color: "#94a3b8" },
  { title: "Modo oscuro", votes: 41, mrr: 214, status: "Abierto", color: "#94a3b8" },
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
    index: "01",
    title: "Priorización por MRR real",
    body: "Cada voto guarda un snapshot del MRR del votante. Ordena tu backlog por dinero que lo respalda, no por ruido.",
  },
  {
    index: "02",
    title: "SDK de identidad (JWT)",
    body: "Tu backend firma un token con id, plan, empresa y MRR del usuario. Un redirect y queda identificado 30 días.",
  },
  {
    index: "03",
    title: "Widget embebible < 30 KB",
    body: "Una línea de script, cero dependencias. Tus usuarios votan sin salir de tu app, en popup o inline.",
  },
  {
    index: "04",
    title: "Roadmap y changelog públicos",
    body: "Kanban automático con tus estados. Cuando algo pasa a «Lanzado», avisamos por email a cada votante.",
  },
  {
    index: "05",
    title: "API pública + webhooks HMAC",
    body: "Crea posts y votos desde tu backend, y recibe eventos firmados en tiempo real. Estilo Stripe.",
  },
  {
    index: "06",
    title: "Boards privados de verdad",
    body: "Solo tu equipo y usuarios identificados por SSO. Los anónimos reciben un 404, no una pantalla de login.",
  },
] as const;

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary" />
            echoboard
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/p/demo"
              className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Demo
            </Link>
            <Link
              href="#precios"
              className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Precios
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        {/* Atmósfera: dos radiales tintados, desenfocados, detrás de todo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.545 0.222 277), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] left-[-8%] h-[380px] w-[380px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.145 160), transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-5xl items-center gap-14 px-6 pb-24 pt-20 md:grid-cols-[7fr_5fr] md:pt-28">
          <div className="flex flex-col items-start gap-6">
            <p className="eyebrow rise">Priorización por revenue</p>
            <h1 className="rise rise-1 font-display text-5xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-[4rem]">
              Prioriza tu roadmap por{" "}
              <em className="text-primary">MRR real</em>, no por votos
            </h1>
            <p className="rise rise-2 max-w-xl text-lg leading-relaxed text-muted-foreground">
              41 votos de usuarios gratuitos hacen ruido. 5 votos que suman{" "}
              <strong className="font-mono text-base font-semibold tabular-nums text-revenue">
                $3.980/mes
              </strong>{" "}
              pagan nóminas. Echoboard identifica a tus usuarios con su revenue y ordena tu
              backlog por el dinero que respalda cada petición.
            </p>
            <div className="rise rise-3 flex flex-wrap items-center gap-3">
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Empezar gratis
                <ArrowRight
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/p/demo"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "text-muted-foreground")}
              >
                Ver board de demo
              </Link>
            </div>
            <p className="rise rise-4 text-xs text-muted-foreground">
              Gratis para siempre en el plan Free · Sin tarjeta · Boards privados incluidos
            </p>
          </div>

          {/* Preview del board: ventana de app, rotada con intención */}
          <div className="rise rise-3 [perspective:1200px]">
            <div className="rotate-[-1.5deg] rounded-2xl border bg-card shadow-lift transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:rotate-0">
              <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-3">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-border" />
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-border" />
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-3 text-xs text-muted-foreground">Peticiones de features</span>
                <span className="ml-auto rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                  Por revenue ↓
                </span>
              </div>
              <div className="flex flex-col p-3">
                {HERO_POSTS.map((post, i) => (
                  <div
                    key={post.title}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 transition-colors duration-150 hover:bg-secondary/60",
                      i > 0 && "border-t border-border/60"
                    )}
                  >
                    <div className="flex min-w-11 flex-col items-center rounded-lg border bg-background px-2 py-1 text-sm">
                      <span aria-hidden className="text-[10px] leading-none text-muted-foreground">▲</span>
                      <span className="font-mono font-semibold tabular-nums">{post.votes}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{post.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
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
                        "font-mono text-sm font-semibold tabular-nums",
                        post.mrr > 1000 ? "text-revenue" : "text-muted-foreground/70"
                      )}
                    >
                      {formatMoney(post.mrr)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="border-t border-border/70 px-4 py-3 text-center text-xs text-muted-foreground">
                El modo oscuro puede esperar. El CSV de{" "}
                <span className="font-mono font-medium tabular-nums text-revenue">$4.830/mes</span>, no.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Línea de libro de cuentas */}
      <section className="border-y border-border/70">
        <p className="mx-auto max-w-5xl overflow-x-auto whitespace-nowrap px-6 py-5 text-center font-mono text-xs tracking-tight text-muted-foreground tabular-nums">
          41 votos × $0/mes = ruido&ensp;·&ensp;5 votos × $796/mes ={" "}
          <span className="font-semibold text-revenue">$3.980/mes de señal</span>
          &ensp;·&ensp;tu backlog ya sabe qué construir
        </p>
      </section>

      {/* Comparativa */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-28">
        <p className="eyebrow text-center">El statu quo, corregido</p>
        <h2 className="mt-4 text-center font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
          Es como Canny, pero del lado de <em className="text-primary">tu margen</em>
        </h2>
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="grid grid-cols-2 gap-x-8 pb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span>Lo habitual</span>
            <span className="text-foreground">Echoboard</span>
          </div>
          {COMPARISON.map((row) => (
            <div
              key={row.us}
              className="grid grid-cols-2 gap-x-8 border-t border-border/70 py-5 text-sm"
            >
              <p className="flex items-start gap-2.5 text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                {row.them}
              </p>
              <p className="flex items-start gap-2.5 font-medium">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-revenue" aria-hidden />
                {row.us}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/70 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-28">
          <p className="eyebrow">El ciclo completo</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
            Todo el feedback, conectado a tus ingresos
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.index} className="group border-t border-border/70 pt-5">
                <span className="font-mono text-xs text-muted-foreground/70">{feature.index}</span>
                <h3 className="mt-2 font-semibold transition-colors duration-200 group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/70" id="precios">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-28">
          <p className="eyebrow text-center">Precios</p>
          <h2 className="mt-4 text-center font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
            Precio plano. Sin sorpresas.
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Nunca pagarás más porque tu producto tenga más usuarios.
          </p>
          <div className="mt-14 grid items-start gap-5 md:grid-cols-3">
            {PLAN_ORDER.map((planKey) => {
              const plan = PLANS[planKey];
              const featured = planKey === "starter";
              return (
                <div
                  key={planKey}
                  className={cn(
                    "hover-lift flex flex-col rounded-2xl border bg-card p-7",
                    featured ? "border-primary/50 shadow-lift md:-mt-3 md:mb-[-4px]" : "shadow-soft"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {featured ? (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 font-display">
                    <span className="text-[2.75rem] font-medium leading-none tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">/mes</span>
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 border-t border-border/70 pt-6 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-revenue" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={cn(
                      "mt-8",
                      buttonVariants({ variant: featured ? "default" : "outline" })
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
      <section className="relative border-t border-border/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[300px] max-w-3xl opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(ellipse, oklch(0.545 0.222 277), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-medium leading-[1.15] tracking-[-0.02em] sm:text-5xl">
            Tu próximo sprint debería <em className="text-primary">pagarse solo</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Monta tu board en dos minutos, pega el widget en tu app y descubre cuánto MRR hay
            detrás de cada petición de tu backlog.
          </p>
          <Link
            href="/login"
            className={cn("group mt-8 inline-flex", buttonVariants({ size: "lg" }))}
          >
            Crear mi board gratis
            <ArrowRight
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary/60" />
            © {new Date().getFullYear()} Echoboard
          </span>
          <div className="flex gap-5">
            <Link href="/p/demo" className="transition-colors duration-150 hover:text-foreground">
              Demo
            </Link>
            <Link href="/login" className="transition-colors duration-150 hover:text-foreground">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
