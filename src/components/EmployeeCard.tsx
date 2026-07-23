import { ListChecks } from "lucide-react";
import type { ParseLogMatchedResponse } from "../types";
import { CopyButton } from "./CopyButton";

export function EmployeeCard({ result }: { result: ParseLogMatchedResponse }) {
  return (
    <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700/60 dark:bg-blue-950/20">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Employee-Facing Message
        </h3>
        <CopyButton text={fullEmployeeText(result)} />
      </div>
      <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {result.employeeMessage}
      </p>
      {result.isSelfService && result.selfServiceSteps && (
        <div className="mt-3 rounded-md border border-blue-200 bg-white/60 p-3 dark:border-blue-800 dark:bg-slate-900/40">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
            <ListChecks size={14} />
            Steps to try
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {result.selfServiceSteps}
          </p>
        </div>
      )}
    </div>
  );
}

function fullEmployeeText(result: ParseLogMatchedResponse): string {
  if (result.isSelfService && result.selfServiceSteps) {
    return `${result.employeeMessage}\n\nSteps to try:\n${result.selfServiceSteps}`;
  }
  return result.employeeMessage;
}
