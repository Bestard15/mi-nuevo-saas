"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error boundary global: cuando algo revienta (una action sin permisos, la
 * base de datos caída), el usuario ve una pantalla con la voz de la marca y
 * un botón de reintento — nunca el pantallazo genérico del framework.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow rise">Algo no cuadra</p>
      <h1 className="rise rise-1 mt-4 max-w-md font-display text-4xl font-medium leading-tight tracking-[-0.02em]">
        Se nos ha descuadrado <em className="text-primary">un asiento</em>
      </h1>
      <p className="rise rise-2 mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Puede ser falta de permisos o un tropiezo momentáneo del servidor.
        Reintenta; si persiste, vuelve al inicio.
      </p>
      <div className="rise rise-3 mt-8 flex items-center gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
