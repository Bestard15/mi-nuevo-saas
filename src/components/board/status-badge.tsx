import { cn } from "@/lib/utils";

export function StatusBadge({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
