"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { computeRoi } from "@/lib/roi";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatMoney } from "@/lib/utils";

/**
 * Anima un número hacia su objetivo con easing cúbico (~450 ms, rAF).
 * Con prefers-reduced-motion el valor se asigna en seco.
 */
function useAnimatedNumber(target: number): number {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    const duration = 450;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = from + (target - from) * eased;
      current.current = value;
      setDisplay(value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return display;
}

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="font-mono text-sm font-semibold tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="eb-range mt-3 w-full"
      />
    </div>
  );
}

export function RoiSimulator() {
  const [suggestions, setSuggestions] = useState(80);
  const [arpu, setArpu] = useState(49);

  const roi = computeRoi(suggestions, arpu);
  const hours = useAnimatedNumber(roi.wastedHours);
  const margin = useAnimatedNumber(roi.silentMargin);
  const payback = useAnimatedNumber(roi.paybackDays);

  return (
    <div
      className="grid gap-0 overflow-hidden rounded-2xl border bg-card shadow-lift md:grid-cols-[5fr_7fr]"
      data-testid="roi-simulator"
    >
      {/* Controles */}
      <div className="flex flex-col gap-8 border-b border-border/70 p-7 md:border-b-0 md:border-r">
        <Slider
          id="roi-suggestions"
          label="Sugerencias de feedback al mes"
          min={10}
          max={500}
          step={5}
          value={suggestions}
          onChange={setSuggestions}
          format={(v) => `${v}`}
        />
        <Slider
          id="roi-arpu"
          label="Ingreso medio por cliente (ARPU)"
          min={10}
          max={500}
          step={1}
          value={arpu}
          onChange={setArpu}
          format={(v) => `${formatMoney(v)}/mes`}
        />
        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
          Modelo conservador: 10 min de triage por sugerencia, 35 % de features mal
          priorizadas al ordenar por votos, 25 % de votantes de pago. Los supuestos completos
          están documentados — ajústalos a tu caso.
        </p>
      </div>

      {/* Resultados: el libro de cuentas del visitante */}
      <div className="flex flex-col p-7">
        <dl className="flex flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-4">
            <dt className="text-sm text-muted-foreground">
              Horas de desarrollo desperdiciadas
            </dt>
            <dd className="font-display text-3xl font-medium tracking-tight">
              {Math.round(hours)}
              <span className="ml-1 font-mono text-sm font-normal text-muted-foreground">
                h/mes
              </span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border/70 py-4">
            <dt className="text-sm text-muted-foreground">
              Margen Silencioso{" "}
              <span className="block text-xs">dinero de clientes de pago que estás ignorando</span>
            </dt>
            <dd
              className="font-display text-3xl font-medium tracking-tight text-revenue"
              data-testid="roi-margin"
            >
              {formatMoney(Math.round(margin))}
              <span className="ml-1 font-mono text-sm font-normal text-muted-foreground">
                /mes
              </span>
            </dd>
          </div>
        </dl>

        <div
          className="mt-2 border-t border-border/70 pt-5"
          aria-live="polite"
          data-testid="roi-payback"
        >
          {roi.plan.price === 0 ? (
            <p className="font-display text-xl font-medium leading-snug tracking-[-0.01em]">
              Con tu volumen te llega el plan <em className="text-primary">Free</em>:
              el retorno es <em className="text-primary">inmediato</em>.
            </p>
          ) : (
            <p className="font-display text-xl font-medium leading-snug tracking-[-0.01em]">
              Con el plan <em className="text-primary">{roi.plan.name}</em> (${roi.plan.price}
              /mes), Echoboard se paga solo en{" "}
              <em className="text-primary">
                {Math.max(1, Math.round(payback))} {Math.max(1, Math.round(payback)) === 1 ? "día" : "días"}
              </em>
              .
            </p>
          )}
          <Link
            href="/login"
            className={cn("group mt-5 inline-flex", buttonVariants({ size: "lg" }))}
            data-testid="roi-cta"
          >
            Empezar con {roi.plan.name}
            <ArrowRight
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
