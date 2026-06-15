import { canAssignClientToPayment } from '@/lib/utils/merge-payment-register-state';
import type {
  PaymentRegisterCacheEntry,
  PaymentRegisterFilterCounts,
  PaymentRegisterListFilters,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

export function canConfirmPayment(entry: PaymentRegisterCacheEntry): boolean {
  if (entry.syncStatus === 'payment_confirmed' || entry.syncStatus === 'client_assigned') {
    return false;
  }
  const trimmedMobile = entry.mobile.trim();
  const mobileOk = Boolean(trimmedMobile) && trimmedMobile !== 'sin-leer';
  return Boolean(entry.ref && entry.paymentDate && mobileOk);
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
      return (
        entry.syncStatus !== 'client_assigned' &&
        (canConfirmPayment(entry) || canAssignClientToPayment(entry))
      );
    case 'pending_sync':
      return entry.syncStatus === 'pending_sync';
    case 'sync_failed':
      return entry.syncStatus === 'sync_failed';
    case 'awaiting_assign':
      return canAssignClientToPayment(entry) && !entry.assignedClientId;
    case 'completed':
      return entry.syncStatus === 'client_assigned';
    default:
      return true;
  }
}

function matchesSearch(entry: PaymentRegisterCacheEntry, search: string): boolean {
  const searchLower = search.trim().toLowerCase();
  if (!searchLower) return true;

  const haystack = [
    entry.pago,
    entry.ref,
    entry.mobile,
    entry.name,
    entry.assignedClientName,
    entry.paymentDate,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchLower);
}

export function filterPaymentRegisters(
  entries: PaymentRegisterCacheEntry[],
  filters: PaymentRegisterListFilters = {}
): PaymentRegisterCacheEntry[] {
  const status = filters.status ?? 'all';

  return entries.filter((entry) => {
    if (!matchesStatusFilter(entry, status)) return false;
    if (filters.search && !matchesSearch(entry, filters.search)) return false;
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
    awaiting_assign: entries.filter((e) => matchesStatusFilter(e, 'awaiting_assign')).length,
    completed: entries.filter((e) => matchesStatusFilter(e, 'completed')).length,
  };
}
