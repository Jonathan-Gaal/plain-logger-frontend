import { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { parseLog, updateTicket, createErrorTemplate, updateErrorTemplate, type CreateErrorTemplateRequest } from "../api/client";
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
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<CreateErrorTemplateRequest>>({
    error_code: ticket.extractedCode ?? "",
    internal_system: "",
    category: "config",
    severity: "medium",
    specialist_diagnostic: "",
    employee_message: "",
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [editingSpecialistDiagnostic, setEditingSpecialistDiagnostic] = useState(false);
  const [editingEmployeeMessage, setEditingEmployeeMessage] = useState(false);
  const [editSpecialistText, setEditSpecialistText] = useState(ticket.matched?.specialistDiagnostic ?? "");
  const [editEmployeeText, setEditEmployeeText] = useState(ticket.matched?.employeeMessage ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  async function handleCreateTemplate() {
    const form = templateForm as CreateErrorTemplateRequest;
    if (!form.error_code || !form.internal_system || !form.specialist_diagnostic || !form.employee_message) {
      setError("All fields except self_service_steps are required.");
      return;
    }
    setCreatingTemplate(true);
    try {
      const result = await createErrorTemplate({ ...form, ticket_id: ticket.id });
      setShowCreateTemplate(false);
      setError(null);
      if (result.ticket) {
        onUpdated(result.ticket);
      }
      // Re-parse to show the newly created template
      await handleReparse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create error template.");
    } finally {
      setCreatingTemplate(false);
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

  async function handleSaveSpecialistEdit() {
    if (!ticket.matched || !editSpecialistText.trim()) {
      setEditError("Specialist diagnostic cannot be empty.");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateErrorTemplate(ticket.matched.id, {
        specialist_diagnostic: editSpecialistText.trim(),
      });
      // Push the server's authoritative value up to the parent rather than
      // mutating the prop in place — otherwise the edit is silently lost the
      // next time TicketsPanel re-renders this ticket from its own state.
      onUpdated({
        ...ticket,
        matched: { ...ticket.matched, specialistDiagnostic: updated.specialistDiagnostic },
      });
      setEditingSpecialistDiagnostic(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update specialist diagnostic.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSaveEmployeeEdit() {
    if (!ticket.matched || !editEmployeeText.trim()) {
      setEditError("Employee message cannot be empty.");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateErrorTemplate(ticket.matched.id, {
        employee_message: editEmployeeText.trim(),
      });
      // See handleSaveSpecialistEdit — same reason for going through onUpdated.
      onUpdated({
        ...ticket,
        matched: { ...ticket.matched, employeeMessage: updated.employeeMessage },
      });
      setEditingEmployeeMessage(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update employee message.");
    } finally {
      setSavingEdit(false);
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
                <div className="mb-1 flex items-start justify-between">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Specialist Diagnostic — {ticket.matched.internalSystem}
                  </p>
                  {ticket.status === "resolved" && (
                    <button
                      type="button"
                      aria-label="Edit specialist diagnostic"
                      onClick={() => {
                        setEditingSpecialistDiagnostic(!editingSpecialistDiagnostic);
                        setEditError(null);
                      }}
                      className="rounded-md p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                {!editingSpecialistDiagnostic ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {ticket.matched.specialistDiagnostic}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={editSpecialistText}
                      onChange={(e) => setEditSpecialistText(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-amber-300 px-2.5 py-1.5 text-xs dark:border-amber-700 dark:bg-slate-800"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveSpecialistEdit}
                        disabled={savingEdit}
                        className="flex-1 rounded-md bg-amber-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-40 dark:bg-amber-700 dark:hover:bg-amber-600"
                      >
                        {savingEdit ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSpecialistDiagnostic(false);
                          setEditSpecialistText(ticket.matched?.specialistDiagnostic ?? "");
                          setEditError(null);
                        }}
                        className="flex-1 rounded-md border border-amber-300 px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="mb-1 flex items-start justify-between">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                    Employee Message
                  </p>
                  {ticket.status === "resolved" && (
                    <button
                      type="button"
                      aria-label="Edit employee message"
                      onClick={() => {
                        setEditingEmployeeMessage(!editingEmployeeMessage);
                        setEditError(null);
                      }}
                      className="rounded-md p-1 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                {!editingEmployeeMessage ? (
                  <>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {ticket.matched.employeeMessage}
                    </p>
                    {ticket.matched.isSelfService && ticket.matched.selfServiceSteps && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Steps:</span> {ticket.matched.selfServiceSteps}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={editEmployeeText}
                      onChange={(e) => setEditEmployeeText(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-blue-300 px-2.5 py-1.5 text-xs dark:border-blue-700 dark:bg-slate-800"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveEmployeeEdit}
                        disabled={savingEdit}
                        className="flex-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        {savingEdit ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployeeMessage(false);
                          setEditEmployeeText(ticket.matched?.employeeMessage ?? "");
                          setEditError(null);
                        }}
                        className="flex-1 rounded-md border border-blue-300 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {editError && <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No matching error template — this ticket's code was not recognized.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateTemplate(!showCreateTemplate)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {showCreateTemplate ? "Cancel" : "Add error code to database"}
              </button>

              {showCreateTemplate && (
                <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                  <input
                    type="text"
                    placeholder="Error code"
                    disabled
                    value={templateForm.error_code || ""}
                    className="w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Internal system (e.g. interconnect)"
                    value={templateForm.internal_system || ""}
                    onChange={(e) => setTemplateForm({ ...templateForm, internal_system: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                  />
                  <select
                    value={templateForm.category || "config"}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="auth">Auth</option>
                    <option value="timeout">Timeout</option>
                    <option value="queue">Queue</option>
                    <option value="db">Database</option>
                    <option value="config">Config</option>
                  </select>
                  <select
                    value={templateForm.severity || "medium"}
                    onChange={(e) => setTemplateForm({ ...templateForm, severity: e.target.value as any })}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <textarea
                    placeholder="Specialist diagnostic"
                    value={templateForm.specialist_diagnostic || ""}
                    onChange={(e) => setTemplateForm({ ...templateForm, specialist_diagnostic: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                  />
                  <textarea
                    placeholder="Employee message"
                    value={templateForm.employee_message || ""}
                    onChange={(e) => setTemplateForm({ ...templateForm, employee_message: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                  />
                  {templateForm.severity !== "low" && (
                    <textarea
                      placeholder="Self-service steps (optional, only for low severity)"
                      disabled
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
                    />
                  )}
                  {templateForm.severity === "low" && (
                    <textarea
                      placeholder="Self-service steps (optional)"
                      value={templateForm.self_service_steps || ""}
                      onChange={(e) => setTemplateForm({ ...templateForm, self_service_steps: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    disabled={creatingTemplate}
                    className="w-full rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {creatingTemplate ? "Creating..." : "Create template & parse"}
                  </button>
                </div>
              )}
            </div>
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
