import { useState } from "react";
import { parseLog } from "../api/client";
import type { ParseLogResponse } from "../types";
import { SpecialistCard } from "./SpecialistCard";
import { EmployeeCard } from "./EmployeeCard";
import { UnmappedCard } from "./UnmappedCard";
import { CodePathNote } from "./CodePathNote";
import { cn } from "../lib/utils";

const MAX_CHARS = 20000;

export function ParseLogPanel({ onParsed }: { onParsed?: () => void }) {
  const [payload, setPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseLogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overLimit = payload.length > MAX_CHARS;
  const canSubmit = payload.trim().length > 0 && !overLimit && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await parseLog(payload);
      setResult(res);
      onParsed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label htmlFor="log-payload" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Paste raw JSON log
        </label>
        <textarea
          id="log-payload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{"error_code": "switch_module.fan", "node": "Interconnect-0N00", "message": "..."}'
          rows={8}
          className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "text-xs",
              overLimit ? "font-medium text-red-600" : "text-slate-500 dark:text-slate-400"
            )}
          >
            {payload.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {loading ? "Parsing…" : "Parse Log"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {result && <ParseLogResult result={result} />}
    </div>
  );
}

function ParseLogResult({ result }: { result: ParseLogResponse }) {
  if (result.status === "matched") {
    return (
      <div className="flex flex-col gap-2">
        <CodePathNote codePath={result.codePath ?? null} />
        <div className="grid gap-4 md:grid-cols-2">
          <SpecialistCard result={result} />
          <EmployeeCard result={result} />
        </div>
      </div>
    );
  }

  if (result.status === "unmapped") {
    return (
      <div className="flex flex-col gap-2">
        <CodePathNote codePath={result.codePath ?? null} />
        <UnmappedCard
          errorCode={result.errorCode}
          suggestions={result.suggestions}
        />
      </div>
    );
  }

  if (result.status === "invalid_payload") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        {result.message}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
      {result.message}
    </div>
  );
}
