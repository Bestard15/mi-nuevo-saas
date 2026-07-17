import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow rise">Error 404</p>
      <h1 className="rise rise-1 mt-4 max-w-md font-display text-4xl font-medium leading-tight tracking-[-0.02em]">
        Esta página no está en el <em className="text-primary">libro de cuentas</em>
      </h1>
      <p className="rise rise-2 mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        O nunca existió, o es privada y no te consta. Si buscabas un board,
        comprueba la dirección con el equipo del producto.
      </p>
      <Link href="/" className={cn("rise rise-3 mt-8", buttonVariants())}>
        Volver al inicio
      </Link>
    </main>
  );
}
