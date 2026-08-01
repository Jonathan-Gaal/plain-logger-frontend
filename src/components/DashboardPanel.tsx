import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchStats } from "../api/client";
import type { Severity, Stats } from "../types";
import { cn } from "../lib/utils";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

const SEVERITY_BAR: Record<Severity, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * The dashboard: whether this tool is actually working.
 *
 * Every figure is a reading off data the app already writes, so nothing here
 * can drift out of sync with reality — there are no counters to maintain.
 * The framing is deliberately about gaps rather than volume: a high parse
 * count means nothing on its own, while coverage and match rate say whether
 * the catalog is keeping up with what specialists are actually pasting.
 */
export function DashboardPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Dashboard
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            How well the known-errors table is keeping up with what specialists
            are pasting.
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

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !stats && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      )}

      {stats && !error && (
        <div className="flex flex-col gap-5" data-testid="dashboard">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              testId="stat-match-rate"
              label="Match rate"
              value={percent(stats.parses.matchRate)}
              detail={`${stats.parses.matched} of ${stats.parses.total} parses resolved`}
            />
            <StatCard
              testId="stat-coverage"
              label="Catalog coverage"
              value={percent(stats.coverage.coverageRate)}
              detail={`${stats.coverage.codesMissingTemplate} of ${stats.coverage.distinctCodesSeen} codes seen have no template`}
            />
            <StatCard
              testId="stat-self-service"
              label="Self-service"
              value={percent(stats.routing.selfServiceRate)}
              detail={`${stats.routing.escalationTemplates} of ${stats.coverage.templateCount} templates escalate to dev`}
            />
            <StatCard
              testId="stat-open-tickets"
              label="Open tickets"
              value={String(stats.tickets.open + stats.tickets.inProgress)}
              detail={`${stats.tickets.resolved} resolved of ${stats.tickets.total} total`}
            />
          </div>

          <Section title="Parse outcomes">
            <Breakdown
              rows={[
                { label: "Matched", value: stats.parses.matched, tone: "bg-green-500" },
                { label: "Unmapped", value: stats.parses.unmapped, tone: "bg-slate-400" },
                { label: "Invalid payload", value: stats.parses.invalid, tone: "bg-red-500" },
              ]}
              total={stats.parses.total}
              emptyLabel="Nothing parsed yet."
            />
          </Section>

          <Section title="Ticket queue by severity">
            <Breakdown
              rows={SEVERITY_ORDER.map((severity) => ({
                label: severity[0].toUpperCase() + severity.slice(1),
                value: stats.tickets.bySeverity[severity],
                tone: SEVERITY_BAR[severity],
              }))}
              total={stats.tickets.total}
              emptyLabel="No tickets."
            />
          </Section>

          <Section title="Most parsed codes">
            {stats.topCodes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nothing parsed yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5" data-testid="top-codes">
                {stats.topCodes.map((code) => (
                  <li
                    key={code.errorCode}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="font-mono text-slate-800 dark:text-slate-100">
                      {code.errorCode}
                    </span>
                    {!code.hasTemplate && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        no template
                      </span>
                    )}
                    <span className="ml-auto tabular-nums text-slate-500 dark:text-slate-400">
                      {code.count} {code.count === 1 ? "parse" : "parses"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  testId,
  label,
  value,
  detail,
}: {
  testId: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * A labelled set of counts with proportional bars.
 *
 * Bars are sized against the total rather than the largest row, so a category
 * holding 90% of the volume looks like 90% — comparing to the max would make
 * every breakdown look evenly split.
 */
function Breakdown({
  rows,
  total,
  emptyLabel,
}: {
  rows: { label: string; value: number; tone: string }[];
  total: number;
  emptyLabel: string;
}) {
  if (total === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 text-slate-600 dark:text-slate-300">
            {row.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <span
              className={cn("block h-full rounded-full", row.tone)}
              style={{ width: `${(row.value / total) * 100}%` }}
            />
          </span>
          <span className="w-12 shrink-0 text-right tabular-nums text-slate-500 dark:text-slate-400">
            {row.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
