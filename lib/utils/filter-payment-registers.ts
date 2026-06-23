import {
  formatPaymentDate,
  getEntryCalendarDateKey,
  normalizePaymentTime,
  timeToMinutes,
} from '@/lib/utils/format-payment-datetime';
import { hasText, trimText } from '@/lib/utils/safe-text';
import { isPaymentWorkflowComplete } from '@/lib/utils/merge-payment-register-state';
import { resolvePaymentAction } from '@/lib/utils/resolve-payment-action';
import type {
  PaymentRegisterCacheEntry,
  PaymentRegisterFilterCounts,
  PaymentRegisterListFilters,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

export function canConfirmPayment(entry: PaymentRegisterCacheEntry): boolean {
  if (entry.syncStatus === 'payment_confirmed') {
    return false;
  }
  const trimmedMobile = entry.mobile.trim();
  const mobileOk = Boolean(trimmedMobile) && trimmedMobile !== 'sin-leer' && trimmedMobile !== 'sin-telefono';
  return Boolean(entry.ref && entry.paymentDate && mobileOk);
}

export function paymentNeedsAction(entry: PaymentRegisterCacheEntry): boolean {
  if (isPaymentWorkflowComplete(entry)) return false;
  return resolvePaymentAction(entry, { isAuthenticated: true }).actionable;
}

export { getPaymentActionHint, getPaymentActionKind, resolvePaymentAction } from '@/lib/utils/resolve-payment-action';
export type { ResolvePaymentActionOptions } from '@/lib/utils/resolve-payment-action';

function matchesStatusFilter(
  entry: PaymentRegisterCacheEntry,
  status: PaymentStatusFilter
): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'needs_action':
      return paymentNeedsAction(entry);
    case 'pending_sync':
      return entry.syncStatus === 'pending_sync';
    case 'sync_failed':
      return entry.syncStatus === 'sync_failed';
    case 'completed':
      return isPaymentWorkflowComplete(entry);
    default:
      return true;
  }
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesSearch(entry: PaymentRegisterCacheEntry, search: string): boolean {
  const searchNormalized = normalizeSearchText(search);
  if (!searchNormalized) return true;

  const haystack = normalizeSearchText(
    [
      entry.pago,
      entry.ref,
      entry.mobile,
      entry.name,
      entry.paymentDate,
      entry.paymentTime,
      normalizePaymentTime(entry.paymentTime),
      formatPaymentDate(entry.paymentDate),
    ]
      .filter((value) => value && value !== '—')
      .join(' ')
  );

  return haystack.includes(searchNormalized);
}

function matchesDateRange(
  entry: PaymentRegisterCacheEntry,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (!dateFrom && !dateTo) return true;

  const key = getEntryCalendarDateKey(entry);
  if (!key) return false;
  if (dateFrom && key < dateFrom) return false;
  if (dateTo && key > dateTo) return false;
  return true;
}

function matchesTimeRange(
  entry: PaymentRegisterCacheEntry,
  timeFrom?: string,
  timeTo?: string
): boolean {
  if (!timeFrom && !timeTo) return true;

  const minutes = timeToMinutes(entry.paymentTime);
  if (minutes == null) return false;

  const fromMinutes = timeFrom ? timeToMinutes(timeFrom) : null;
  const toMinutes = timeTo ? timeToMinutes(timeTo) : null;
  if (fromMinutes != null && minutes < fromMinutes) return false;
  if (toMinutes != null && minutes > toMinutes) return false;
  return true;
}

export function hasActivePaymentFilters(filters: PaymentRegisterListFilters = {}): boolean {
  const status = filters.status ?? 'all';
  return (
    status !== 'all' ||
    hasText(filters.search) ||
    hasText(filters.dateFrom) ||
    hasText(filters.dateTo) ||
    hasText(filters.timeFrom) ||
    hasText(filters.timeTo)
  );
}

export function filterPaymentRegisters(
  entries: PaymentRegisterCacheEntry[],
  filters: PaymentRegisterListFilters = {}
): PaymentRegisterCacheEntry[] {
  const status = filters.status ?? 'all';
  const dateFrom = hasText(filters.dateFrom) ? trimText(filters.dateFrom) : undefined;
  const dateTo = hasText(filters.dateTo) ? trimText(filters.dateTo) : undefined;
  const timeFrom = hasText(filters.timeFrom)
    ? normalizePaymentTime(trimText(filters.timeFrom))
    : undefined;
  const timeTo = hasText(filters.timeTo) ? normalizePaymentTime(trimText(filters.timeTo)) : undefined;

  return entries.filter((entry) => {
    if (!matchesStatusFilter(entry, status)) return false;
    if (hasText(filters.search) && !matchesSearch(entry, trimText(filters.search))) return false;
    if (!matchesDateRange(entry, dateFrom, dateTo)) return false;
    if (!matchesTimeRange(entry, timeFrom, timeTo)) return false;
    return true;
  });
}

export function getPaymentFilterCounts(
  entries: PaymentRegisterCacheEntry[]
): PaymentRegisterFilterCounts {
  return {
    all: entries.length,
    needs_action: entries.filter((e) => matchesStatusFilter(e, 'needs_action')).length,
    pending_sync: entries.filter((e) => matchesStatusFilter(e, 'pending_sync')).length,
    sync_failed: entries.filter((e) => matchesStatusFilter(e, 'sync_failed')).length,
    completed: entries.filter((e) => matchesStatusFilter(e, 'completed')).length,
  };
}
