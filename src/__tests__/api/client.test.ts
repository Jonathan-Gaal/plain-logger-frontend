import { describe, it, expect } from 'vitest';
import { parseLog, fetchHistory, fetchTickets } from '../../api/client';

describe('API Client', () => {
  describe('parseLog', () => {
    it('should parse valid JSON and return matched result', async () => {
      const result = await parseLog('{"error_code": "TEST_ERROR"}');
      expect(result.status).toBe('matched');
      if (result.status === 'matched') {
        expect(result.errorCode).toBe('TEST_ERROR');
      }
    });

    it('should reject empty payload', async () => {
      try {
        await parseLog('');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err instanceof Error).toBe(true);
      }
    });

    it('should reject oversized payload', async () => {
      try {
        await parseLog('x'.repeat(20001));
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err instanceof Error).toBe(true);
      }
    });
  });

  describe('fetchHistory', () => {
    it('should fetch and return history entries', async () => {
      const history = await fetchHistory(20);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('id');
      expect(history[0]).toHaveProperty('extractedCode');
    });
  });

  describe('fetchTickets', () => {
    it('should fetch all tickets by default', async () => {
      const tickets = await fetchTickets('all');
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets[0]).toHaveProperty('ticketNumber');
      expect(tickets[0]).toHaveProperty('status');
    });

    it('should filter tickets by status', async () => {
      const tickets = await fetchTickets('open');
      expect(Array.isArray(tickets)).toBe(true);
    });
  });
});
