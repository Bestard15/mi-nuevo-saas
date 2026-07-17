import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton del roadmap: tres columnas con su cabecera y tarjetas. */
export default function RoadmapLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-9 w-48" />
        </div>
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col}>
            <Skeleton className="h-12 w-full" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 2 + col }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
