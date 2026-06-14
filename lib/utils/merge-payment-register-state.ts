import type { PaymentRegisterInvoiceStatus, SyncStatus } from '@/types/payment/payment-register-cache.types';

const SYNC_RANK: Record<SyncStatus, number> = {
  sync_failed: 0,
  pending_sync: 1,
  synced: 2,
  payment_confirmed: 3,
  client_assigned: 4,
};

/** Keep the most advanced invoice status when merging local cache with remote pull. */
export function mergeInvoiceStatus(
  local: PaymentRegisterInvoiceStatus,
  remote: PaymentRegisterInvoiceStatus
): PaymentRegisterInvoiceStatus {
  if (local === 'paid' || remote === 'paid') return 'paid';
  if (local === 'pending' || remote === 'pending') return 'pending';
  return remote ?? local ?? null;
}

/**
 * Never downgrade sync progress on pull — e.g. keep payment_confirmed when the
 * register list still shows invoice pending/null after a local confirm.
 */
export function mergeSyncStatus(
  existing: SyncStatus,
  remoteInvoiceStatus: PaymentRegisterInvoiceStatus
): SyncStatus {
  if (existing === 'sync_failed' && remoteInvoiceStatus === 'paid') {
    return 'payment_confirmed';
  }

  let remoteDerived: SyncStatus = existing;

  if (remoteInvoiceStatus === 'paid') {
    remoteDerived = existing === 'client_assigned' ? 'client_assigned' : 'payment_confirmed';
  } else if (existing === 'pending_sync' || existing === 'sync_failed') {
    remoteDerived = existing;
  } else {
    remoteDerived = 'synced';
  }

  return SYNC_RANK[remoteDerived] > SYNC_RANK[existing] ? remoteDerived : existing;
}

export function canAssignClientToPayment(entry: {
  syncStatus: SyncStatus;
  invoiceStatus: PaymentRegisterInvoiceStatus;
}): boolean {
  if (entry.syncStatus === 'client_assigned') return false;
  return entry.syncStatus === 'payment_confirmed' || entry.invoiceStatus === 'paid';
}
