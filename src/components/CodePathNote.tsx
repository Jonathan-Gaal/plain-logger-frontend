import { Crosshair } from "lucide-react";

/**
 * Shows which field of the pasted payload the error code was read from.
 *
 * The backend searches nested payloads (a Sentry event, an axios failure, a
 * Winston line), so a match can come from a field the specialist didn't
 * notice was there. Naming the exact path keeps that traceable instead of
 * asking them to trust it — and a nested path is called out explicitly,
 * since that's the case where it isn't obvious.
 */
export function CodePathNote({ codePath }: { codePath: string | null }) {
  if (!codePath) return null;

  const isNested = codePath.includes(".") || codePath.includes("[");

  return (
    <p
      data-testid="code-path-note"
      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
    >
      <Crosshair size={13} className="shrink-0" />
      <span>
        Code read from{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {codePath}
        </code>
        {isNested && " — nested inside the pasted payload"}
      </span>
    </p>
  );
}
