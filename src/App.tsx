import { useState } from "react";
import { ParseLogPanel } from "./components/ParseLogPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { TicketsPanel } from "./components/TicketsPanel";
import { UnmappedQueuePanel } from "./components/UnmappedQueuePanel";
import { DashboardPanel } from "./components/DashboardPanel";
import { cn } from "./lib/utils";

type Tab = "parse" | "tickets" | "unmapped" | "dashboard";

function App() {
  const [tab, setTab] = useState<Tab>("parse");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Plain Logger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Decode internal error logs into specialist and employee-facing messages.
          </p>
        </div>
      </header>

      <nav className="mx-auto max-w-4xl px-4 pt-4">
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <TabButton active={tab === "parse"} onClick={() => setTab("parse")}>
            Parse Log
          </TabButton>
          <TabButton active={tab === "tickets"} onClick={() => setTab("tickets")}>
            Tickets
          </TabButton>
          {/*
            "Unmapped Codes", not "Unmapped" — the Tickets panel already has
            an "Unmapped" filter pill, and both are on screen at once when
            that tab is open.
          */}
          <TabButton active={tab === "unmapped"} onClick={() => setTab("unmapped")}>
            Unmapped Codes
          </TabButton>
          <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
            Dashboard
          </TabButton>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {tab === "parse" && (
          <div className="flex flex-col gap-6">
            <ParseLogPanel onParsed={() => setHistoryRefreshKey((k) => k + 1)} />
            <HistoryPanel refreshKey={historyRefreshKey} />
          </div>
        )}
        {tab === "tickets" && <TicketsPanel />}
        {tab === "unmapped" && <UnmappedQueuePanel />}
        {tab === "dashboard" && <DashboardPanel />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

export default App;
