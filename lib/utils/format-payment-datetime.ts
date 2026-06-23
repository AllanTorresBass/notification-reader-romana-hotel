const LOCALE = 'es-VE';
const TIMEZONE = 'America/Caracas';

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

/**
 * Extract YYYY-MM-DD from a payment calendar date string.
 * Payment dates are wall-calendar values in Venezuela — never shift by timezone.
 */
export function parsePaymentCalendarDate(value: unknown): string | null {
  if (value == null) return null;
  const dateStr = String(value).trim();
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
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

/**
 * Normalize Date objects or ISO instants to a Caracas calendar date key.
 * PostgreSQL `date` values (UTC midnight) keep their stored calendar day.
 */
export function toCalendarDateKey(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    if (isUtcMidnight(value)) return dateKeyFromUtcDate(value);
    return formatDateKeyInTimezone(value);
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

/** Normalize API / pg payment dates to YYYY-MM-DD. */
export function normalizePaymentDate(value: unknown): string {
  return parsePaymentCalendarDate(value) ?? toCalendarDateKey(value) ?? '';
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

/** Normalize HH:mm, HH:mm:ss, or serialized pg time values to HH:mm. */
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

function formatCalendarDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

/** Readable date, e.g. "13 jun 2026". */
export function formatPaymentDate(dateStr: string): string {
  const key = parsePaymentCalendarDate(dateStr);
  if (!key) return '—';
  return formatCalendarDateKey(key);
}

/** Readable time, e.g. "10:30 p. m.". Wall-clock — not shifted by device timezone. */
export function formatPaymentTime(timeStr: string): string {
  const normalized = normalizePaymentTime(timeStr);
  if (!normalized) return '—';
  const [h, min] = normalized.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr.trim() || '—';
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2020, 0, 1, h, min || 0, 0)));
}

/** Combined date and time for list cards. */
export function formatPaymentDateTime(dateStr: string, timeStr: string): string | null {
  const dateLabel = formatPaymentDate(dateStr);
  const timeLabel = formatPaymentTime(timeStr);
  const hasDate = dateLabel !== '—';
  const hasTime = timeLabel !== '—';

  if (hasDate && hasTime) return `${dateLabel} · ${timeLabel}`;
  if (hasDate) return dateLabel;
  if (hasTime) return timeLabel;
  return null;
}

/** Minutes since midnight for HH:mm comparisons, or null if invalid. */
export function timeToMinutes(timeStr: string): number | null {
  const normalized = normalizePaymentTime(timeStr);
  if (!normalized) return null;
  const [hours, minutes] = normalized.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/** Best calendar date for an entry: payment date, else capture date in Caracas. */
export function getEntryCalendarDateKey(entry: {
  paymentDate: string;
  createdAt: number;
}): string | null {
  return (
    parsePaymentCalendarDate(entry.paymentDate) ??
    toCalendarDateKey(new Date(entry.createdAt))
  );
}

export function getCaracasTodayKey(now: number = Date.now()): string {
  return formatDateKeyInTimezone(new Date(now));
}

export function getCaracasYesterdayKey(now: number = Date.now()): string {
  const [year, month, day] = getCaracasTodayKey(now).split('-').map(Number);
  const prev = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return formatDateKeyInTimezone(prev);
}

/** Sort key preferring payment date/time over capture time. */
export function getEntrySortTimestamp(entry: {
  paymentDate: string;
  paymentTime: string;
  createdAt: number;
}): number {
  const dateKey = getEntryCalendarDateKey(entry);
  if (!dateKey) return entry.createdAt;

  const [year, month, day] = dateKey.split('-').map(Number);
  const time = normalizePaymentTime(entry.paymentTime);
  const [hours = 0, minutes = 0] = time ? time.split(':').map(Number) : [0, 0];
  return new Date(year, month - 1, day, hours, minutes).getTime();
}
