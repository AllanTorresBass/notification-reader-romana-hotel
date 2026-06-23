import type { PaymentFailureClass, PaymentFailureStage } from '@/types/payment/payment-sync-failure.types';
import type { PaymentDateSource } from '@la-romana/payment-datetime';

export type SyncStatus =
  | 'pending_sync'
  | 'synced'
  | 'payment_confirmed'
  | 'sync_failed';

export type PaymentRegisterInvoiceStatus = 'pending' | 'paid' | null;

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
  dateSource: PaymentDateSource;
  notificationKey: string;
  notificationId: string;
  invoiceStatus: PaymentRegisterInvoiceStatus;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  failureClass: PaymentFailureClass | null;
  failureStage: PaymentFailureStage | null;
  createdAt: number;
  updatedAt: number;
}

export type { PaymentFailureClass, PaymentFailureStage, PaymentActionKind } from '@/types/payment/payment-sync-failure.types';

export type PaymentStatusFilter =
  | 'all'
  | 'needs_action'
  | 'pending_sync'
  | 'sync_failed'
  | 'completed';

export interface PaymentRegisterListFilters {
  status?: PaymentStatusFilter;
  search?: string;
  /** Inclusive YYYY-MM-DD */
  dateFrom?: string;
  /** Inclusive YYYY-MM-DD */
  dateTo?: string;
  /** Inclusive HH:mm (24h) */
  timeFrom?: string;
  /** Inclusive HH:mm (24h) */
  timeTo?: string;
}

export interface PaymentRegisterFilterCounts {
  all: number;
  needs_action: number;
  pending_sync: number;
  sync_failed: number;
  completed: number;
}

export interface PaymentRegisterListPage {
  items: PaymentRegisterCacheEntry[];
  nextOffset: number | null;
  total: number;
}

export type PaymentSyncJobType =
  | 'create_register'
  | 'confirm_payment'
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
  version: 1 | 2;
  entries: PaymentRegisterCacheEntry[];
}
