import type {
  HistoryEntry,
  ParseLogResponse,
  Ticket,
  TicketStatus,
  UpdateTicketRequest,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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

export { ApiError };
