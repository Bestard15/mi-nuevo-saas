import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { Badge } from "@/components/ui/badge";

// Public tenant board: /p/{project-slug}. Always rendered on demand — feedback
// changes constantly and each tenant's board must reflect live data.
export const dynamic = "force-dynamic";

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (!project || project.isPrivate) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <Badge variant="secondary">Feedback</Badge>
      </div>
      <p className="mt-4 text-muted-foreground">
        Board público del proyecto. Los posts, votos y comentarios llegan en la Fase 1.
      </p>
    </main>
  );
}
