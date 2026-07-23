import { useState } from "react";
import { X } from "lucide-react";
import { parseLog, updateTicket } from "../api/client";
import type { ParseLogResponse, Ticket, TicketStatus } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { CopyButton } from "./CopyButton";
import { SpecialistCard } from "./SpecialistCard";
import { EmployeeCard } from "./EmployeeCard";
import { UnmappedCard } from "./UnmappedCard";
import { formatTimestamp } from "../lib/utils";

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved"];

export function TicketDetailModal({
  ticket,
  onClose,
  onUpdated,
}: {
  ticket: Ticket;
  onClose: () => void;
  onUpdated: (updated: Ticket) => void;
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [assignedSpecialist, setAssignedSpecialist] = useState(ticket.assignedSpecialist ?? "");
  const [resolutionNote, setResolutionNote] = useState(ticket.resolutionNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseLogResponse | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const needsResolutionNote = status === "resolved";
  const payloadJson = ticket.extractedCode
    ? JSON.stringify({ error_code: ticket.extractedCode }, null, 2)
    : null;

  async function handleReparse() {
    if (!payloadJson) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await parseLog(payloadJson);
      setParseResult(res);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (needsResolutionNote && resolutionNote.trim().length === 0) {
      setError("A resolution note is required when marking a ticket resolved.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTicket(ticket.id, {
        status,
        assignedSpecialist: assignedSpecialist.trim() || null,
        ...(needsResolutionNote ? { resolutionNote: resolutionNote.trim() } : {}),
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {ticket.ticketNumber}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submitted by {ticket.submittedBy} · {formatTimestamp(ticket.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={ticket.severity} />
            <StatusBadge status={ticket.status} />
          </div>

          {payloadJson && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Raw error code (JSON)
                </p>
                <div className="flex items-center gap-2">
                  <CopyButton text={payloadJson} />
                  {ticket.status !== "resolved" && (
                    <button
                      type="button"
                      onClick={handleReparse}
                      disabled={parsing}
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      {parsing ? "Parsing…" : "Parse"}
                    </button>
                  )}
                </div>
              </div>
              <pre className="overflow-x-auto rounded bg-slate-900 p-2 font-mono text-xs text-slate-100 dark:bg-black/40">
                {payloadJson}
              </pre>
              {parseError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{parseError}</p>
              )}
            </div>
          )}

          {parseResult && (
            <div className="space-y-3">
              {parseResult.status === "matched" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <SpecialistCard result={parseResult} />
                  <EmployeeCard result={parseResult} />
                </div>
              )}
              {parseResult.status === "unmapped" && (
                <UnmappedCard errorCode={parseResult.errorCode} />
              )}
              {(parseResult.status === "invalid_payload" || parseResult.status === "error") && (
                <p className="text-xs text-red-600 dark:text-red-400">{parseResult.message}</p>
              )}
            </div>
          )}

          {ticket.matched ? (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Specialist Diagnostic — {ticket.matched.internalSystem}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {ticket.matched.specialistDiagnostic}
                </p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                <p className="mb-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Employee Message
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {ticket.matched.employeeMessage}
                </p>
                {ticket.matched.isSelfService && ticket.matched.selfServiceSteps && (
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Steps:</span> {ticket.matched.selfServiceSteps}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No matching error template — this ticket's code was not recognized.
            </p>
          )}

          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "in_progress" ? "In Progress" : s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Assigned Specialist
              </label>
              <input
                type="text"
                value={assignedSpecialist}
                onChange={(e) => setAssignedSpecialist(e.target.value)}
                placeholder="e.g. specialist.chu"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {needsResolutionNote && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Resolution Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
