import type { Metadata } from "next";
import Link from "next/link";

import { signIn } from "@/auth";
import { SubmitButton } from "@/components/submit-button";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Entrar — Echoboard",
};

/** Mini libro de cuentas del panel visual: votos vs dinero, de un vistazo. */
const LEDGER_ROWS = [
  { title: "Modo oscuro", votes: 41, mrr: 214 },
  { title: "SSO con SAML", votes: 5, mrr: 3980 },
  { title: "Exportar a CSV", votes: 12, mrr: 4830 },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.86-3c-1.07.72-2.44 1.14-4.08 1.14-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.29a12 12 0 0 0 0 10.72l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 1.29 6.64l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Columna del formulario */}
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-[15px] font-semibold tracking-tight transition-opacity duration-150 hover:opacity-70"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary" />
          echoboard
        </Link>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="rise font-display text-3xl font-medium tracking-[-0.02em]">
              Bienvenido de vuelta
            </h1>
            <p className="rise rise-1 mt-2 text-sm text-muted-foreground">
              Entra con tu cuenta de trabajo. Sin contraseñas que olvidar.
            </p>

            <div className="rise rise-2 mt-8 flex flex-col gap-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <SubmitButton
                  variant="outline"
                  className="h-11 w-full justify-center gap-2.5 text-[15px]"
                  pendingText="Conectando con Google…"
                  autoFocus
                >
                  <GoogleIcon />
                  Continuar con Google
                </SubmitButton>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <SubmitButton
                  variant="outline"
                  className="h-11 w-full justify-center gap-2.5 text-[15px]"
                  pendingText="Conectando con GitHub…"
                >
                  <GitHubIcon />
                  Continuar con GitHub
                </SubmitButton>
              </form>
            </div>

            <p className="rise rise-3 mt-6 text-xs leading-relaxed text-muted-foreground">
              Al continuar aceptas que creemos tu cuenta si aún no existe. Tu primer proyecto,
              con su board privado, tarda menos de un minuto.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          ¿Solo mirando?{" "}
          <Link href="/p/demo" className="font-medium text-primary hover:underline">
            Explora el board de demo →
          </Link>
        </p>
      </section>

      {/* Columna visual: el libro de cuentas */}
      <section
        aria-hidden
        className="relative hidden items-center justify-center overflow-hidden border-l border-border/70 bg-secondary/40 lg:flex"
      >
        <div
          className="pointer-events-none absolute -top-24 right-[-15%] h-[520px] w-[520px] rounded-full opacity-[0.09] blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.545 0.222 277), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.145 160), transparent 70%)" }}
        />

        <div className="relative max-w-md px-10">
          <div
            className="float-soft rounded-2xl border bg-card p-5 shadow-lift"
            data-testid="login-ledger"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Tu backlog, en dinero</span>
              <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                Por revenue ↓
              </span>
            </div>
            <div className="mt-3 flex flex-col">
              {[...LEDGER_ROWS]
                .sort((a, b) => b.mrr - a.mrr)
                .map((row, i) => (
                  <div
                    key={row.title}
                    className={cn(
                      "flex items-center justify-between gap-4 py-2.5",
                      i > 0 && "border-t border-border/60"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">{row.votes} votos</p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold tabular-nums",
                        row.mrr > 1000 ? "text-revenue" : "text-muted-foreground/70"
                      )}
                    >
                      {formatMoney(row.mrr)}
                    </span>
                  </div>
                ))}
            </div>
            <p className="mt-2 border-t border-border/70 pt-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
              señal total ={" "}
              <span className="font-semibold text-revenue">
                {formatMoney(LEDGER_ROWS.reduce((sum, r) => (r.mrr > 1000 ? sum + r.mrr : sum), 0))}
                /mes
              </span>
            </p>
          </div>
          <p className="mt-8 text-center font-display text-2xl font-medium leading-snug tracking-[-0.01em]">
            Los votos opinan.
            <br />
            <em className="text-primary">El MRR decide.</em>
          </p>
        </div>
      </section>
    </main>
  );
}
