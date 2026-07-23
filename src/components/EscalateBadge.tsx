import { cn } from "../lib/utils";

export function EscalateBadge({ escalateToDev }: { escalateToDev: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        escalateToDev
          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      {escalateToDev ? "Escalate to dev" : "Do not escalate"}
    </span>
  );
}
