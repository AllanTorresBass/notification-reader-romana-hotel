import { copy } from '@/constants/copy';

export function formatPagoDisplay(pago: string): string {
  const num = Number.parseFloat(pago);
  if (Number.isNaN(num)) return pago;
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSyncStatusLabel(
  syncStatus: string,
  invoiceStatus: 'pending' | 'paid' | null
): string {
  if (syncStatus === 'client_assigned') return copy.syncStatus.clientAssigned;
  if (syncStatus === 'payment_confirmed' || invoiceStatus === 'paid') {
    return copy.syncStatus.paymentConfirmed;
  }
  if (syncStatus === 'synced' || invoiceStatus === 'pending') {
    return copy.syncStatus.invoicePending;
  }
  if (syncStatus === 'pending_sync') return copy.syncStatus.pendingSync;
  if (syncStatus === 'sync_failed') return copy.syncStatus.syncFailed;
  return copy.syncStatus.registered;
}

export function getSyncStepIndex(
  syncStatus: string,
  invoiceStatus: 'pending' | 'paid' | null
): number {
  if (syncStatus === 'client_assigned') return 4;
  if (syncStatus === 'payment_confirmed' || invoiceStatus === 'paid') return 3;
  if (syncStatus === 'synced') return 2;
  if (syncStatus === 'pending_sync' || syncStatus === 'sync_failed') return 1;
  return 1;
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d`;
}
