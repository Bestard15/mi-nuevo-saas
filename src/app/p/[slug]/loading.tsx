import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton del board público: misma silueta que la página real. */
export default function BoardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border p-4">
              <Skeleton className="h-12 w-12" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    </main>
  );
}
