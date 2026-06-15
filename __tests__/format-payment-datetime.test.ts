import {
  formatPaymentDate,
  formatPaymentDateTime,
  formatPaymentTime,
  normalizePaymentTime,
  toCalendarDateKey,
} from '@/lib/utils/format-payment-datetime';

describe('format-payment-datetime', () => {
  describe('toCalendarDateKey', () => {
    it('parses YYYY-MM-DD', () => {
      expect(toCalendarDateKey('2026-06-13')).toBe('2026-06-13');
    });

    it('parses ISO timestamps in Caracas timezone', () => {
      expect(toCalendarDateKey('2026-06-13T04:00:00.000Z')).toBe('2026-06-13');
    });
  });

  describe('normalizePaymentTime', () => {
    it('normalizes HH:mm:ss to HH:mm', () => {
      expect(normalizePaymentTime('22:29:00')).toBe('22:29');
    });

    it('pads single-digit hours', () => {
      expect(normalizePaymentTime('9:30')).toBe('09:30');
    });
  });

  describe('formatPaymentDate', () => {
    it('formats calendar dates in Spanish', () => {
      expect(formatPaymentDate('2026-06-13')).toMatch(/13.*jun.*2026/i);
    });

    it('returns em dash when empty', () => {
      expect(formatPaymentDate('')).toBe('—');
    });
  });

  describe('formatPaymentTime', () => {
    it('formats 24h times with locale', () => {
      expect(formatPaymentTime('22:29')).toMatch(/10:29|22:29/i);
    });

    it('returns em dash when empty', () => {
      expect(formatPaymentTime('')).toBe('—');
    });
  });

  describe('formatPaymentDateTime', () => {
    it('combines date and time for cards', () => {
      const line = formatPaymentDateTime('2026-06-13', '22:29');
      expect(line).toMatch(/13.*jun.*2026/i);
      expect(line).toMatch(/·/);
    });

    it('returns null when both are missing', () => {
      expect(formatPaymentDateTime('', '')).toBeNull();
    });
  });
});
