import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock server for API tests
export const mockServer = setupServer(
  http.post('http://localhost:3000/api/parse-log', () => {
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
  http.get('http://localhost:3000/api/history', () => {
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
  http.get('http://localhost:3000/api/tickets', () => {
    return HttpResponse.json({
      status: 'ok',
      tickets: [
        {
          id: 'ticket-1',
          ticketNumber: 'PL-001',
          submittedBy: 'test-user',
          extractedCode: 'TEST_ERROR',
          status: 'open',
          severity: 'medium',
          assignedSpecialist: null,
          resolutionNote: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: null,
          matched: {
            internalSystem: 'test-system',
            specialistDiagnostic: 'Test diagnostic',
            employeeMessage: 'Test message',
            isSelfService: false,
            selfServiceSteps: null,
          },
        },
      ],
    });
  })
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
