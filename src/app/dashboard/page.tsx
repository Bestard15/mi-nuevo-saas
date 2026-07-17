import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { memberships, organizations, projects } from "@/db/schema";
import { CreateProjectForm } from "@/components/dashboard/create-project-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await db
    .select({
      project: projects,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .innerJoin(projects, eq(projects.organizationId, organizations.id))
    .where(eq(memberships.userId, session.user.id));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Sesión iniciada como {session.user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="ghost">
            Salir
          </Button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">Tus proyectos</h2>
          <div className="mt-3 flex flex-col gap-3">
            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aún no tienes proyectos. Crea el primero →
              </p>
            ) : (
              rows.map(({ project, role }) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-xl border bg-card p-4"
                >
                  <div>
                    <Link
                      href={`/dashboard/${project.slug}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      <Link href={`/p/${project.slug}`} className="hover:underline">
                        /p/{project.slug}
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.isPrivate ? <Badge variant="outline">Privado</Badge> : null}
                    <Badge variant="secondary">{role}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <aside>
          <CreateProjectForm />
        </aside>
      </div>
    </main>
  );
}
