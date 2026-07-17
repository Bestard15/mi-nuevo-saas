import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton del dashboard admin: stats + tabla de priorización. */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-80 rounded-xl" />
    </main>
  );
}
