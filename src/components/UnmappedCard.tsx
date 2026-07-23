import { AlertTriangle } from "lucide-react";

export function UnmappedCard({ errorCode }: { errorCode: string | null }) {
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
    </div>
  );
}
