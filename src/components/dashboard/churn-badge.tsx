import { cn, formatMoney } from "@/lib/utils";
import type { ChurnRisk } from "@/lib/churn";

/**
 * Badge minimalista de «MRR en riesgo»: punto de tinta + cifra y días en
 * mono. El tooltip (CSS puro, accesible por hover Y foco de teclado)
 * explica el porqué con la cifra exacta — señal de libro de cuentas, no
 * alarma de incendios.
 */
export function ChurnBadge({ risk }: { risk: ChurnRisk }) {
  const tone =
    risk.level === "risk"
      ? { dot: "bg-[oklch(0.55_0.16_35)]", text: "text-[oklch(0.45_0.14_35)]", border: "border-[oklch(0.55_0.16_35_/_0.35)]" }
      : { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-500", border: "border-amber-500/35" };

  return (
    <span className="group relative inline-flex" data-churn={risk.level}>
      <span
        tabIndex={0}
        className={cn(
          "inline-flex cursor-help items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          tone.text,
          tone.border
        )}
      >
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
        {formatMoney(risk.mrr)} · {risk.days} d
      </span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 translate-y-1 rounded-lg border bg-popover p-3 text-left text-xs font-normal leading-relaxed text-popover-foreground opacity-0 shadow-lift",
          "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        )}
      >
        Este post acumula{" "}
        <strong className="font-mono font-semibold tabular-nums text-revenue">
          {formatMoney(risk.mrr)}
        </strong>{" "}
        de clientes activos que llevan más de{" "}
        <strong className="font-mono font-semibold tabular-nums">{risk.days} días</strong>{" "}
        esperando. Programarlo reduce el riesgo de cancelación.
      </span>
    </span>
  );
}
