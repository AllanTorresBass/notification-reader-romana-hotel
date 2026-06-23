const TIMEZONE = 'America/Caracas';

export type PaymentDateSource =
  | 'notification_text'
  | 'post_time'
  | 'manual'
  | 'remote_api'
  | 'unknown';

function formatDateKeyInTimezone(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function dateKeyFromUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parsePaymentCalendarDate(value: unknown): string | null {
  if (value == null) return null;
  const dateStr = String(value).trim();
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function toCalendarDateKey(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    if (isUtcMidnight(value)) return dateKeyFromUtcDate(value);
    return formatDateKeyInTimezone(value);
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return toCalendarDateKey(String(value));
  }

  const dateStr = String(value).trim();
  if (!dateStr) return null;

  if (dateStr.includes('T')) {
    const instant = new Date(dateStr);
    if (Number.isNaN(instant.getTime())) return null;
    if (isUtcMidnight(instant)) return dateKeyFromUtcDate(instant);
    return formatDateKeyInTimezone(instant);
  }

  return parsePaymentCalendarDate(dateStr);
}

export function normalizePaymentDate(value: unknown): string {
  return parsePaymentCalendarDate(value) ?? toCalendarDateKey(value) ?? '';
}

export function getLocalDateParts(date = new Date()): { today: string; month: string } {
  const today = formatDateKeyInTimezone(date);
  return { today, month: today.slice(0, 7) };
}

export function instantToCaracasDateKey(instant: Date | number): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  return formatDateKeyInTimezone(date);
}

export function instantToCaracasWallTime(instant: Date | number): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const min = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${min}`;
}

export function normalizePaymentTimeFromDb(time: unknown): string {
  if (time == null) return '';

  if (time instanceof Date) {
    if (Number.isNaN(time.getTime())) return '';
    const hours = String(time.getUTCHours()).padStart(2, '0');
    const minutes = String(time.getUTCMinutes()).padStart(2, '0');
    const seconds = String(time.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  const trimmed = String(time).trim();
  if (!trimmed) return '';

  const isoMatch = /T(\d{2}:\d{2}(?::\d{2})?)/.exec(trimmed);
  if (isoMatch) return isoMatch[1].length === 5 ? `${isoMatch[1]}:00` : isoMatch[1];

  return trimmed;
}

export function normalizePaymentTime(time: unknown): string {
  if (time == null) return '';

  if (time instanceof Date) {
    if (Number.isNaN(time.getTime())) return '';
    const hours = String(time.getUTCHours()).padStart(2, '0');
    const minutes = String(time.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const trimmed = String(time).trim();
  if (!trimmed) return '';

  const isoMatch = /T(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
  const match = isoMatch ?? /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return trimmed;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return trimmed;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function repairPaymentDateTimeFields(input: {
  paymentDate: string;
  paymentTime: string;
}): { paymentDate: string; paymentTime: string } {
  return {
    paymentDate: normalizePaymentDate(input.paymentDate),
    paymentTime: normalizePaymentTime(input.paymentTime),
  };
}
