const LOCALE = 'es-VE';
const TIMEZONE = 'America/Caracas';

/** Normalize Date objects, YYYY-MM-DD, or ISO timestamps to a calendar date key. */
export function toCalendarDateKey(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatDateKeyInTimezone(value);
  }

  const dateStr = String(value).trim();
  if (!dateStr) return null;

  if (dateStr.includes('T')) {
    const instant = new Date(dateStr);
    if (Number.isNaN(instant.getTime())) return null;
    return formatDateKeyInTimezone(instant);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

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

function calendarDateFromKey(key: string): Date | null {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Normalize HH:mm or HH:mm:ss to HH:mm. */
export function normalizePaymentTime(timeStr: string): string {
  const trimmed = timeStr.trim();
  if (!trimmed) return '';
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return trimmed;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return trimmed;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Readable date, e.g. "13 jun 2026". */
export function formatPaymentDate(dateStr: string): string {
  const key = toCalendarDateKey(dateStr);
  if (!key) return '—';
  const date = calendarDateFromKey(key);
  if (!date) return dateStr.trim() || '—';
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Readable time, e.g. "10:30 p. m.". */
export function formatPaymentTime(timeStr: string): string {
  const normalized = normalizePaymentTime(timeStr);
  if (!normalized) return '—';
  const [h, min] = normalized.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr.trim() || '—';
  const date = new Date();
  date.setHours(h, min || 0, 0, 0);
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
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
