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
  if (syncStatus === 'client_assigned') return 'Cliente asociado';
  if (syncStatus === 'payment_confirmed' || invoiceStatus === 'paid') return 'Pago confirmado';
  if (syncStatus === 'synced' || invoiceStatus === 'pending') return 'Factura pendiente';
  if (syncStatus === 'pending_sync') return 'Pendiente de sync';
  if (syncStatus === 'sync_failed') return 'Error de sincronización';
  return 'Registrado';
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
