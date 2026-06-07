export type SyncStatus =
  | 'pending_sync'
  | 'synced'
  | 'payment_confirmed'
  | 'client_assigned'
  | 'sync_failed';

export type InvoiceStatus = 'pending' | 'paid' | null;

export interface PaymentRegisterCacheEntry {
  localId: string;
  remoteRegisterId: string | null;
  remoteInvoiceId: string | null;
  name: string | null;
  pago: string;
  mobile: string;
  ref: string;
  paymentDate: string;
  paymentTime: string;
  notificationKey: string;
  notificationId: string;
  invoiceStatus: InvoiceStatus;
  syncStatus: SyncStatus;
  assignedClientId: string | null;
  assignedClientName: string | null;
  lastSyncError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentRegisterListPage {
  items: PaymentRegisterCacheEntry[];
  nextOffset: number | null;
  total: number;
}

export type PaymentSyncJobType =
  | 'create_register'
  | 'confirm_payment'
  | 'assign_client'
  | 'pull_registers';

export interface PaymentSyncJob {
  id: string;
  type: PaymentSyncJobType;
  localId: string;
  payload?: Record<string, unknown>;
  attempts: number;
  nextRetryAt: number;
  createdAt: number;
}

export interface PaymentSyncQueueEnvelope {
  version: 1;
  jobs: PaymentSyncJob[];
}

export interface PaymentRegisterStoreEnvelope {
  version: 1;
  entries: PaymentRegisterCacheEntry[];
}
