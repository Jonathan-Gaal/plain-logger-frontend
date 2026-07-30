import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock server for API tests.
//
// Handlers use a wildcard host (`*/api/...`) rather than a hardcoded
// `http://localhost:3000` so they match regardless of what VITE_API_BASE_URL
// is set to in the environment. This keeps the mocked unit tests robust even
// if a base-URL override leaks in (e.g. from the test:all runner's e2e phase).
export const mockServer = setupServer(
  http.post('*/api/parse-log', () => {
    return HttpResponse.json({
      status: 'matched',
      errorCode: 'TEST_ERROR',
      internalSystem: 'test-system',
      severity: 'low',
      isSelfService: true,
      selfServiceSteps: 'Test steps',
      specialistDiagnostic: 'Test diagnostic',
      employeeMessage: 'Test message',
      escalateToDev: false,
      historyId: 'test-history-id',
    });
  }),
  http.get('*/api/history', () => {
    return HttpResponse.json({
      status: 'ok',
      history: [
        {
          id: 'test-id',
          extractedCode: 'TEST_ERROR',
          matchStatus: 'matched',
          createdAt: new Date().toISOString(),
          internalSystem: 'test-system',
          severity: 'low',
          escalateToDev: false,
        },
      ],
    });
  }),
  http.get('http://localhost:3000/api/tickets', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const tickets = status ? mockTickets.filter((t) => t.status === status) : mockTickets;
    return HttpResponse.json({ status: 'ok', tickets });
  }),
  http.post('http://localhost:3000/api/error-templates', async ({ request }) => {
    const body = (await request.json()) as { ticket_id?: string; internal_system: string };
    const response: Record<string, unknown> = { status: 'ok', id: 'new-template-id' };
    if (body.ticket_id) {
      const ticket = mockTickets.find((t) => t.id === body.ticket_id);
      if (ticket) {
        response.ticket = {
          ...ticket,
          matched: {
            id: 'new-template-id',
            internalSystem: body.internal_system,
            specialistDiagnostic: 'Newly created diagnostic',
            employeeMessage: 'Newly created employee message',
            isSelfService: false,
            selfServiceSteps: null,
          },
        };
      }
    }
    return HttpResponse.json(response, { status: 201 });
  }),
  http.patch('http://localhost:3000/api/error-templates/:id', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        status: 'ok',
        template: {
          errorCode: 'TEST_ERROR',
          internalSystem: 'test-system',
          specialistDiagnostic:
            (body.specialist_diagnostic as string | undefined) || 'Test diagnostic',
          employeeMessage:
            (body.employee_message as string | undefined) || 'Test message',
          isSelfService: false,
          selfServiceSteps: null,
          escalateToDev: false,
        },
      },
      { status: 200 }
    );
  })
);

export const mockTickets = [
  {
    id: 'ticket-1',
    ticketNumber: 'PL-001',
    submittedBy: 'test-user',
    extractedCode: 'UNMAPPED_CODE_1',
    status: 'open',
    severity: 'medium',
    assignedSpecialist: null,
    resolutionNote: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    resolvedAt: null,
    matched: null,
  },
  {
    id: 'ticket-2',
    ticketNumber: 'PL-002',
    submittedBy: 'test-user',
    extractedCode: 'TEST_ERROR',
    status: 'open',
    severity: 'critical',
    assignedSpecialist: null,
    resolutionNote: null,
    createdAt: '2026-07-02T10:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
    resolvedAt: null,
    matched: {
      id: 'template-test-1',
      internalSystem: 'test-system',
      specialistDiagnostic: 'Test diagnostic',
      employeeMessage: 'Test message',
      isSelfService: false,
      selfServiceSteps: null,
    },
  },
  {
    id: 'ticket-3',
    ticketNumber: 'PL-003',
    submittedBy: 'test-user',
    extractedCode: 'UNMAPPED_CODE_2',
    status: 'resolved',
    severity: 'low',
    assignedSpecialist: null,
    resolutionNote: 'Fixed manually',
    createdAt: '2026-07-03T10:00:00.000Z',
    updatedAt: '2026-07-03T10:00:00.000Z',
    resolvedAt: '2026-07-03T10:00:00.000Z',
    matched: null,
  },
  // Resolved AND mapped — the only combination that exposes the
  // edit-message affordances in TicketDetailModal.
  {
    id: 'ticket-4',
    ticketNumber: 'PL-004',
    submittedBy: 'test-user',
    extractedCode: 'RESOLVED_MAPPED_CODE',
    status: 'resolved',
    severity: 'high',
    assignedSpecialist: 'specialist.test',
    resolutionNote: 'Resolved and mapped',
    createdAt: '2026-07-04T10:00:00.000Z',
    updatedAt: '2026-07-04T10:00:00.000Z',
    resolvedAt: '2026-07-04T10:00:00.000Z',
    matched: {
      id: 'template-test-4',
      internalSystem: 'resolved-system',
      specialistDiagnostic: 'Original diagnostic',
      employeeMessage: 'Original employee message',
      isSelfService: false,
      selfServiceSteps: null,
    },
  },
];

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
