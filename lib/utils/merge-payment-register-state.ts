import type { PaymentRegisterInvoiceStatus, SyncStatus } from '@/types/payment/payment-register-cache.types';

const SYNC_RANK: Record<SyncStatus, number> = {
  sync_failed: 0,
  pending_sync: 1,
  synced: 2,
  payment_confirmed: 3,
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

/** Never downgrade sync progress on pull. */
export function mergeSyncStatus(
  existing: SyncStatus,
  remoteInvoiceStatus: PaymentRegisterInvoiceStatus
): SyncStatus {
  if (existing === 'sync_failed' && remoteInvoiceStatus === 'paid') {
    return 'payment_confirmed';
  }

  let remoteDerived: SyncStatus = existing;

  if (remoteInvoiceStatus === 'paid') {
    remoteDerived = 'payment_confirmed';
  } else if (existing === 'pending_sync' || existing === 'sync_failed') {
    remoteDerived = existing;
  } else {
    remoteDerived = 'synced';
  }

  return SYNC_RANK[remoteDerived] > SYNC_RANK[existing] ? remoteDerived : existing;
}

export function isPaymentWorkflowComplete(entry: {
  syncStatus: SyncStatus;
  invoiceStatus: PaymentRegisterInvoiceStatus;
}): boolean {
  return entry.syncStatus === 'payment_confirmed' || entry.invoiceStatus === 'paid';
}
