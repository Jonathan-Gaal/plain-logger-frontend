import { useEffect, useState, useCallback } from "react";
import { fetchTickets } from "../api/client";
import type { Ticket, TicketStatus } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { TicketDetailModal } from "./TicketDetailModal";
import { formatTimestamp, cn } from "../lib/utils";

type TicketFilter = TicketStatus | "all" | "unmapped" | "mapped";

const FILTERS: Array<{ label: string; value: TicketFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Unmapped", value: "unmapped" },
  { label: "Mapped", value: "mapped" },
];

/** "unmapped"/"mapped" filter by whether a ticket has a matched template — a
 * dimension the backend doesn't query by, so fetch everything and filter here. */
function matchesFilter(ticket: Ticket, filter: TicketFilter): boolean {
  if (filter === "unmapped") return ticket.matched === null;
  if (filter === "mapped") return ticket.matched !== null;
  if (filter === "all") return true;
  return ticket.status === filter;
}

export function TicketsPanel() {
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Ticket[];
      if (filter === "unmapped" || filter === "mapped") {
        data = (await fetchTickets("all")).filter((t) => matchesFilter(t, filter));
      } else {
        data = await fetchTickets(filter);
      }
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdated(updated: Ticket) {
    setSelected((cur) => (cur && cur.id === updated.id ? updated : cur));
    setTickets((cur) =>
      cur
        .map((t) => (t.id === updated.id ? updated : t))
        .filter((t) => matchesFilter(t, filter))
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && tickets.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading tickets…</p>
      )}

      {!loading && tickets.length === 0 && !error && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No tickets found.</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => setSelected(ticket)}
                className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {ticket.ticketNumber}
                    </span>
                    <SeverityBadge severity={ticket.severity} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {ticket.submittedBy} · {ticket.extractedCode ?? "no code"} ·{" "}
                    {formatTimestamp(ticket.createdAt)}
                  </p>
                </div>
                {ticket.assignedSpecialist && (
                  <span className="shrink-0 text-xs text-slate-400">
                    {ticket.assignedSpecialist}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
