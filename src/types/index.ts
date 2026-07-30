export type Severity = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type MatchStatus = "matched" | "unmapped" | "invalid_payload";

export interface ParseLogMatchedResponse {
  status: "matched";
  errorCode: string;
  internalSystem: string;
  severity: Severity;
  isSelfService: boolean;
  selfServiceSteps: string | null;
  specialistDiagnostic: string;
  employeeMessage: string;
  escalateToDev: boolean;
  historyId: string;
}

export interface ParseLogUnmappedResponse {
  status: "unmapped";
  errorCode: string | null;
  specialistDiagnostic: null;
  employeeMessage: null;
  historyId: string;
}

export interface ParseLogInvalidResponse {
  status: "invalid_payload";
  message: string;
}

export interface ParseLogErrorResponse {
  status: "error";
  message: string;
}

export type ParseLogResponse =
  | ParseLogMatchedResponse
  | ParseLogUnmappedResponse
  | ParseLogInvalidResponse
  | ParseLogErrorResponse;

export interface HistoryEntry {
  id: string;
  extractedCode: string | null;
  matchStatus: MatchStatus;
  createdAt: string;
  internalSystem: string | null;
  severity: Severity | null;
  escalateToDev: boolean | null;
}

export interface TicketMatchedTemplate {
  id: string;
  internalSystem: string;
  specialistDiagnostic: string;
  employeeMessage: string;
  isSelfService: boolean;
  selfServiceSteps: string | null;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  submittedBy: string;
  extractedCode: string | null;
  status: TicketStatus;
  severity: Severity;
  assignedSpecialist: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  matched: TicketMatchedTemplate | null;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  assignedSpecialist?: string | null;
  resolutionNote?: string;
}

export interface ErrorTemplate {
  errorCode: string;
  internalSystem: string;
  specialistDiagnostic: string;
  employeeMessage: string;
  isSelfService: boolean;
  selfServiceSteps: string | null;
  escalateToDev: boolean;
}

export interface UpdateErrorTemplateRequest {
  specialist_diagnostic?: string;
  employee_message?: string;
}
