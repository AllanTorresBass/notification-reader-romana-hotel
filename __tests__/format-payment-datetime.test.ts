import {
  formatPaymentDate,
  formatPaymentDateTime,
  formatPaymentTime,
  normalizePaymentDate,
  normalizePaymentTime,
  parsePaymentCalendarDate,
  toCalendarDateKey,
} from '@/lib/utils/format-payment-datetime';

describe('format-payment-datetime', () => {
  describe('parsePaymentCalendarDate', () => {
    it('parses YYYY-MM-DD without timezone shift', () => {
      expect(parsePaymentCalendarDate('2026-06-13')).toBe('2026-06-13');
    });

    it('parses ISO midnight UTC as the same calendar date', () => {
      expect(parsePaymentCalendarDate('2026-06-23T00:00:00.000Z')).toBe('2026-06-23');
    });
  });

  describe('toCalendarDateKey', () => {
    it('parses YYYY-MM-DD', () => {
      expect(toCalendarDateKey('2026-06-13')).toBe('2026-06-13');
    });

    it('parses ISO timestamps in Caracas timezone', () => {
      expect(toCalendarDateKey('2026-06-13T04:00:00.000Z')).toBe('2026-06-13');
    });

    it('keeps PostgreSQL date columns on their stored calendar day', () => {
      expect(toCalendarDateKey(new Date('2026-06-23T00:00:00.000Z'))).toBe('2026-06-23');
      expect(toCalendarDateKey('2026-06-23T00:00:00.000Z')).toBe('2026-06-23');
    });
  });

  describe('normalizePaymentDate', () => {
    it('normalizes plain and ISO API values', () => {
      expect(normalizePaymentDate('2026-06-23')).toBe('2026-06-23');
      expect(normalizePaymentDate('2026-06-23T00:00:00.000Z')).toBe('2026-06-23');
    });
  });

  describe('normalizePaymentTime', () => {
    it('normalizes HH:mm:ss to HH:mm', () => {
      expect(normalizePaymentTime('22:29:00')).toBe('22:29');
    });

    it('pads single-digit hours', () => {
      expect(normalizePaymentTime('9:30')).toBe('09:30');
    });

    it('normalizes serialized pg time values', () => {
      expect(normalizePaymentTime('1970-01-01T07:44:00.000Z')).toBe('07:44');
      expect(normalizePaymentTime(new Date('1970-01-01T07:44:00.000Z'))).toBe('07:44');
    });
  });

  describe('formatPaymentDate', () => {
    it('formats calendar dates in Spanish', () => {
      expect(formatPaymentDate('2026-06-13')).toMatch(/13.*jun.*2026/i);
    });

    it('formats ISO midnight UTC without shifting the day', () => {
      expect(formatPaymentDate('2026-06-23T00:00:00.000Z')).toMatch(/23.*jun.*2026/i);
    });

    it('returns em dash when empty', () => {
      expect(formatPaymentDate('')).toBe('—');
    });
  });

  describe('formatPaymentTime', () => {
    it('formats 24h times with locale', () => {
      expect(formatPaymentTime('22:29')).toMatch(/10:29|22:29/i);
    });

    it('formats serialized pg time values', () => {
      expect(formatPaymentTime('1970-01-01T07:44:00.000Z')).toMatch(/7:44|07:44/i);
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

    it('keeps ISO payment dates on the correct day', () => {
      const line = formatPaymentDateTime('2026-06-23T00:00:00.000Z', '07:44:00');
      expect(line).toMatch(/23.*jun.*2026/i);
      expect(line).toMatch(/07:44/i);
    });

    it('returns null when both are missing', () => {
      expect(formatPaymentDateTime('', '')).toBeNull();
    });
  });
});
