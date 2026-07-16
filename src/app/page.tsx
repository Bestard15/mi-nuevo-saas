import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <Badge variant="secondary">En construcción — MVP Fase 0</Badge>
      <h1 className="text-5xl font-bold tracking-tight">Echoboard</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Feedback boards, roadmap y changelog para tu producto. Como Canny, pero con precio plano
        transparente, tableros privados desde el primer plan y priorización por revenue en vez de
        por votos.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          Empezar gratis
        </Link>
        <Link href="/p/demo" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Ver board de demo
        </Link>
      </div>
      <div className="mt-8 grid w-full gap-4 sm:grid-cols-3 text-left">
        <Card>
          <CardHeader>
            <CardTitle>Precio plano</CardTitle>
            <CardDescription>Sin pricing por tracked users ni topes de asientos.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tu factura no se duplica porque tu producto crezca.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Privado por defecto</CardTitle>
            <CardDescription>Tableros privados incluidos en todos los planes.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La privacidad de tu feedback no es un upsell.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prioriza por revenue</CardTitle>
            <CardDescription>Ordena por impacto en MRR, no solo por votos.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Identifica a tus usuarios con el SDK y decide con datos de ingresos.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
