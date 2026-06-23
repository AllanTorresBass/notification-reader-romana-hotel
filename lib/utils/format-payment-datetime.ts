import type { PaymentDateSource } from '@la-romana/payment-datetime';
import {
  formatPaymentDate,
  formatPaymentDateTime,
  formatPaymentTime,
  getLocalDateParts,
  instantToCaracasDateKey,
  instantToCaracasWallTime,
  normalizePaymentDate,
  normalizePaymentTime,
  normalizePaymentTimeFromDb,
  parsePaymentCalendarDate,
  repairPaymentDateTimeFields,
  toCalendarDateKey,
} from '@la-romana/payment-datetime';

export type { PaymentDateSource };
export {
  formatPaymentDate,
  formatPaymentDateTime,
  formatPaymentTime,
  getLocalDateParts,
  instantToCaracasDateKey,
  instantToCaracasWallTime,
  normalizePaymentDate,
  normalizePaymentTime,
  normalizePaymentTimeFromDb,
  parsePaymentCalendarDate,
  repairPaymentDateTimeFields,
  toCalendarDateKey,
};

export function getCaracasTodayKey(now: number = Date.now()): string {
  return instantToCaracasDateKey(now);
}

export function getCaracasYesterdayKey(now: number = Date.now()): string {
  const [year, month, day] = getCaracasTodayKey(now).split('-').map(Number);
  const prev = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return instantToCaracasDateKey(prev);
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

/** Sort key preferring payment date/time over capture time (UTC-safe wall-clock). */
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
  return Date.UTC(year, month - 1, day, hours, minutes);
}

export function isRemoteOnlyNotificationKey(notificationKey: string): boolean {
  return notificationKey.startsWith('remote-');
}

export function resolveMergedPaymentDate(
  existing: { paymentDate: string; notificationKey: string; dateSource?: PaymentDateSource },
  remoteDate: string
): string {
  const localKey = parsePaymentCalendarDate(existing.paymentDate);
  const remoteKey = normalizePaymentDate(remoteDate);

  const preferLocal =
    localKey &&
    existing.paymentDate.trim() &&
    !isRemoteOnlyNotificationKey(existing.notificationKey) &&
    existing.dateSource !== 'remote_api';

  if (preferLocal) {
    return localKey;
  }

  return remoteKey || localKey || existing.paymentDate || '';
}

export function resolveMergedPaymentTime(
  existing: { paymentTime: string; notificationKey: string; dateSource?: PaymentDateSource },
  remoteTime: string
): string {
  const localTime = normalizePaymentTime(existing.paymentTime);
  const remoteTimeKey = normalizePaymentTime(remoteTime);

  const preferLocal =
    localTime &&
    existing.paymentTime.trim() &&
    !isRemoteOnlyNotificationKey(existing.notificationKey) &&
    existing.dateSource !== 'remote_api';

  if (preferLocal) {
    return localTime;
  }

  return remoteTimeKey || localTime || existing.paymentTime || '';
}
