import { cn } from "@/lib/utils";

/** Placeholder que respira mientras llega el contenido real. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-secondary", className)}
      {...props}
    />
  );
}
