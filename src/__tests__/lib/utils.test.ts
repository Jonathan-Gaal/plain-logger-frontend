import { describe, it, expect } from 'vitest';
import { cn, formatTimestamp } from '../../lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge classnames correctly', () => {
      const result = cn('px-2', 'py-1', 'text-sm');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('text-sm');
    });

    it('should handle conditional classnames', () => {
      const result = cn('px-2', true && 'py-1', false && 'text-red-500');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).not.toContain('text-red-500');
    });

    it('should override conflicting Tailwind classes', () => {
      const result = cn('px-2 px-4');
      expect(result).toContain('px-4');
    });
  });

  describe('formatTimestamp', () => {
    it('should format ISO timestamp to locale string', () => {
      const iso = '2026-07-23T10:00:00Z';
      const formatted = formatTimestamp(iso);
      expect(formatted).toMatch(/\d+:\d+/); // Contains time HH:MM
      expect(formatted.length).toBeGreaterThan(0); // Has content
    });

    it('should handle current time', () => {
      const now = new Date().toISOString();
      const formatted = formatTimestamp(now);
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
