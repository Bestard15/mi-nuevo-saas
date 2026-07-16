import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar en Echoboard</CardTitle>
          <CardDescription>Accede con tu cuenta de Google o GitHub.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full" variant="outline">
              Continuar con Google
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full" variant="outline">
              Continuar con GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
