import { AlertTriangle } from "lucide-react";
import type { Suggestion } from "../types";
import { SeverityBadge } from "./SeverityBadge";

export function UnmappedCard({
  errorCode,
  suggestions = [],
}: {
  errorCode: string | null;
  suggestions?: Suggestion[];
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <AlertTriangle size={16} />
        Code not recognized
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Extracted code:{" "}
        <span className="font-mono font-medium">{errorCode ?? "no code found"}</span>
      </p>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
        This isn't in the known-errors table yet. It's been logged so the platform
        team can add a mapping for it later.
      </p>

      {suggestions.length > 0 && <SuggestionList suggestions={suggestions} />}
    </div>
  );
}

/**
 * Closest known codes to the one that missed.
 *
 * Deliberately framed as leads to check, not as a match: an unmapped result
 * is still unmapped, and a specialist acting on a near-miss needs to confirm
 * it's actually the same error first. The confidence figure is there so a
 * 0.9 and a 0.4 don't read as equally trustworthy.
 */
function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Did you mean?
      </h4>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Closest known codes. Confirm the payload really describes the same
        failure before using one of these.
      </p>
      <ul className="mt-2.5 flex flex-col gap-2" data-testid="suggestion-list">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.errorCode}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-100">
              {suggestion.errorCode}
            </span>
            <SeverityBadge severity={suggestion.severity} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {suggestion.internalSystem}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span
                className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-slate-500 dark:bg-slate-400"
                  style={{ width: `${Math.round(suggestion.confidence * 100)}%` }}
                />
              </span>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {Math.round(suggestion.confidence * 100)}% match
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
