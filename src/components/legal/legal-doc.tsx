import Link from "next/link";

/**
 * Maqueta de documento legal clásica del sistema de diseño: eyebrow,
 * título en Fraunces, cuerpo en Geist a 65ch con interlineado cómodo y
 * secciones separadas por espacio + hairline — un documento que respira,
 * no un muro de texto.
 */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <nav className="mb-12 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight transition-opacity duration-150 hover:opacity-70"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary" />
          echoboard
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          ← Volver al inicio
        </Link>
      </nav>

      <header>
        <p className="eyebrow rise">{eyebrow}</p>
        <h1 className="rise rise-1 mt-3 font-display text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl">
          {title}
        </h1>
        <p className="rise rise-2 mt-3 font-mono text-xs text-muted-foreground">
          Última actualización: {updated}
        </p>
      </header>

      <article className="rise rise-3 mt-10 flex flex-col gap-10 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </article>

      <footer className="mt-16 border-t border-border/70 pt-6 text-sm text-muted-foreground">
        <p>
          ¿Dudas sobre este documento? Escríbenos a{" "}
          <a href="mailto:hola@updatalink.com" className="font-medium text-primary hover:underline">
            hola@updatalink.com
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <Link href="/legal/aviso-legal" className="hover:text-foreground hover:underline">
            Aviso Legal
          </Link>
          <Link href="/legal/privacidad" className="hover:text-foreground hover:underline">
            Política de Privacidad
          </Link>
          <Link href="/legal/cookies" className="hover:text-foreground hover:underline">
            Política de Cookies
          </Link>
        </div>
      </footer>
    </main>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 font-display text-xl font-medium tracking-[-0.01em]">
        <span aria-hidden className="font-mono text-xs font-normal text-muted-foreground/70">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Ficha de datos identificativos: el "membrete" del documento. */
export function LegalFacts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="overflow-hidden rounded-xl border bg-card shadow-soft">
      {rows.map(([term, detail], i) => (
        <div
          key={term}
          className={cnRow(i)}
        >
          <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {term}
          </dt>
          <dd className="mt-0.5 text-sm font-medium sm:mt-0 sm:text-right">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function cnRow(index: number): string {
  return [
    "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6",
    index > 0 ? "border-t border-border/60" : "",
  ].join(" ");
}
