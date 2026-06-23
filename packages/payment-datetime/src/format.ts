import {
  normalizePaymentTime,
  parsePaymentCalendarDate,
  toCalendarDateKey,
} from './core';

const LOCALE = 'es-VE';

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

export function formatPaymentDate(dateStr: string): string {
  const key = parsePaymentCalendarDate(dateStr) ?? toCalendarDateKey(dateStr);
  if (!key) return dateStr?.trim() ? dateStr : '—';
  return formatCalendarDateKey(key);
}

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

export function formatDate(dateStr: string): string {
  return formatPaymentDate(dateStr);
}

export function formatTime(timeStr: string): string {
  return formatPaymentTime(timeStr);
}
