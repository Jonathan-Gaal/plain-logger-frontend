import type {
  ErrorTemplate,
  HistoryEntry,
  ParseLogResponse,
  Stats,
  Ticket,
  TicketStatus,
  UnmappedGroup,
  UpdateErrorTemplateRequest,
  UpdateTicketRequest,
} from "../types";

// Resolve the backend URL. In dev, default to the local backend on :3000.
// In a PRODUCTION build, a missing VITE_API_BASE_URL previously fell back to
// "http://localhost:3000" — which can never work for a real visitor (their
// browser's "localhost" is their own machine), so the ticket list just came up
// blank with no clue why. Now: in production we default to the known deployed
// backend and warn loudly, so a forgotten env var degrades gracefully instead
// of silently breaking. Set VITE_API_BASE_URL in Vercel to override this.
const DEPLOYED_BACKEND_URL = "https://plain-logger-backend-pearl.vercel.app";

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) return fromEnv;
  // import.meta.env.PROD is true in `vite build` output, false in `vite dev`.
  if (import.meta.env.PROD) {
    console.warn(
      "[plain-logger] VITE_API_BASE_URL is not set for this production build. " +
        `Falling back to ${DEPLOYED_BACKEND_URL}. Set VITE_API_BASE_URL in your ` +
        "Vercel project settings and redeploy to make this explicit."
    );
    return DEPLOYED_BACKEND_URL;
  }
  return "http://localhost:3000";
}

const API_BASE_URL = resolveApiBaseUrl();

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Is it running?`
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok && res.status >= 500) {
    throw new ApiError(data?.message ?? "Server error. Please try again.");
  }
  return data as T;
}

export function parseLog(payload: string): Promise<ParseLogResponse> {
  return request<ParseLogResponse>("/api/parse-log", {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}

export async function fetchHistory(limit = 20): Promise<HistoryEntry[]> {
  const data = await request<{ status: string; history: HistoryEntry[] }>(
    `/api/history?limit=${limit}`
  );
  return data.history ?? [];
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await request<{ status: string }>(`/api/history/${id}`, { method: "DELETE" });
}

export async function fetchStats(): Promise<Stats> {
  const data = await request<{ status: string; stats: Stats; message?: string }>(
    "/api/stats"
  );
  if (data.status !== "ok") {
    throw new ApiError(data.message ?? "Failed to load stats.");
  }
  return data.stats;
}

export async function fetchUnmapped(limit = 25): Promise<UnmappedGroup[]> {
  const data = await request<{ status: string; unmapped: UnmappedGroup[] }>(
    `/api/unmapped?limit=${limit}`
  );
  return data.unmapped ?? [];
}

export async function fetchTickets(status?: TicketStatus | "all"): Promise<Ticket[]> {
  const query = status && status !== "all" ? `?status=${status}&limit=100` : "?limit=100";
  const data = await request<{ status: string; tickets: Ticket[] }>(`/api/tickets${query}`);
  return data.tickets ?? [];
}

export async function updateTicket(
  id: string,
  fields: UpdateTicketRequest
): Promise<Ticket> {
  const data = await request<{ status: string; ticket: Ticket; message?: string }>(
    `/api/tickets/${id}`,
    { method: "PATCH", body: JSON.stringify(fields) }
  );
  if (data.status !== "ok") {
    throw new ApiError(data.message ?? "Failed to update ticket.");
  }
  return data.ticket;
}

export interface CreateErrorTemplateRequest {
  error_code: string;
  internal_system: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  specialist_diagnostic: string;
  employee_message: string;
  self_service_steps?: string;
  ticket_id?: string;
}

export async function createErrorTemplate(
  template: CreateErrorTemplateRequest
): Promise<{ status: string; id: string; ticket?: Ticket }> {
  const data = await request<{ status: string; id: string; ticket?: Ticket; message?: string }>(
    "/api/error-templates",
    { method: "POST", body: JSON.stringify(template) }
  );
  if (data.status !== "ok") {
    throw new ApiError(data?.message ?? "Failed to create error template.");
  }
  return data;
}

export async function updateErrorTemplate(
  id: string,
  updates: UpdateErrorTemplateRequest
): Promise<ErrorTemplate> {
  const data = await request<{ status: string; template: ErrorTemplate; message?: string }>(
    `/api/error-templates/${id}`,
    { method: "PATCH", body: JSON.stringify(updates) }
  );
  if (data.status !== "ok") {
    throw new ApiError(data.message ?? "Failed to update error template.");
  }
  return data.template;
}

export { ApiError };
