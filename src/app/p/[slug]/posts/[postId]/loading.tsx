import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton del detalle de post: título, autor, impacto y comentarios. */
export default function PostLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-9 w-4/5" />
          <div className="mt-4 flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-12 h-32" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </main>
  );
}
