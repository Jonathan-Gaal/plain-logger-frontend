import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { deleteHistoryEntry, fetchHistory } from "../api/client";
import type { HistoryEntry } from "../types";
import { formatTimestamp } from "../lib/utils";

const MATCH_STATUS_LABELS: Record<string, string> = {
  matched: "Matched",
  unmapped: "Unmapped",
  invalid_payload: "Invalid",
};

const MATCH_STATUS_STYLES: Record<string, string> = {
  matched: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  unmapped: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  invalid_payload: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function HistoryPanel({ refreshKey }: { refreshKey: number }) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(20);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, refreshKey, load]);

  async function handleDelete(id: string) {
    const previous = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    try {
      await deleteHistoryEntry(id);
    } catch (err) {
      setEntries(previous);
      setError(err instanceof Error ? err.message : "Failed to delete entry.");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        Parse History
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          {error && (
            <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          {loading && entries.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          )}
          {!loading && entries.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No history yet.</p>
          )}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MATCH_STATUS_STYLES[entry.matchStatus]}`}
                    >
                      {MATCH_STATUS_LABELS[entry.matchStatus]}
                    </span>
                    <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                      {entry.extractedCode ?? "no code"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatTimestamp(entry.createdAt)}
                    {entry.internalSystem ? ` · ${entry.internalSystem}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete history entry"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
