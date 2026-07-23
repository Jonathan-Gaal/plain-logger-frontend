import type { ParseLogMatchedResponse } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { EscalateBadge } from "./EscalateBadge";
import { CopyButton } from "./CopyButton";

export function SpecialistCard({ result }: { result: ParseLogMatchedResponse }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Specialist Diagnostic
          </h3>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            {result.internalSystem}
          </p>
        </div>
        <CopyButton text={result.specialistDiagnostic} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <SeverityBadge severity={result.severity} />
        <EscalateBadge escalateToDev={result.escalateToDev} />
      </div>
      <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {result.specialistDiagnostic}
      </p>
    </div>
  );
}
