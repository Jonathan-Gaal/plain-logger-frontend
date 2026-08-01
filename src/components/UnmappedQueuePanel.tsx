import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchUnmapped } from "../api/client";
import type { UnmappedGroup } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { formatTimestamp } from "../lib/utils";

/**
 * The gap queue: error codes that have been parsed but have no template yet,
 * ranked by how often they've been hit.
 *
 * This is the screen that turns Plain Logger from a lookup into something
 * that compounds. Every unmapped parse was already being recorded; grouped by
 * code with a hit count, the same data says which missing template is costing
 * the most, which is the question worth acting on.
 */
export function UnmappedQueuePanel() {
  const [groups, setGroups] = useState<UnmappedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await fetchUnmapped(25));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load unmapped codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalMisses = groups.reduce((sum, group) => sum + group.hitCount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Unmapped codes
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Codes specialists have hit that have no template yet. Highest hit
            count first — that's the gap worth closing next.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
          Refresh
        </button>
      </div>

      {groups.length > 0 && (
        <p
          data-testid="unmapped-summary"
          className="text-sm text-slate-600 dark:text-slate-300"
        >
          <strong className="font-semibold text-slate-900 dark:text-slate-100">
            {groups.length}
          </strong>{" "}
          {groups.length === 1 ? "code" : "codes"} with no template, accounting
          for{" "}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">
            {totalMisses}
          </strong>{" "}
          {totalMisses === 1 ? "failed lookup" : "failed lookups"}.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && groups.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            No unmapped codes.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Every code parsed so far has a template. Nothing to close.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <ul className="flex flex-col gap-2" data-testid="unmapped-queue">
          {groups.map((group) => (
            <UnmappedRow key={group.errorCode} group={group} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UnmappedRow({ group }: { group: UnmappedGroup }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
          {group.errorCode}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {group.hitCount} {group.hitCount === 1 ? "hit" : "hits"}
        </span>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {group.hitCount === 1
            ? `Seen ${formatTimestamp(group.lastSeen)}`
            : `First seen ${formatTimestamp(group.firstSeen)} · last ${formatTimestamp(group.lastSeen)}`}
        </span>
      </div>

      {group.topSuggestion && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>Closest known code:</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
            {group.topSuggestion.errorCode}
          </span>
          <SeverityBadge severity={group.topSuggestion.severity} />
          <span className="tabular-nums">
            {Math.round(group.topSuggestion.confidence * 100)}% match
          </span>
        </p>
      )}
    </li>
  );
}
