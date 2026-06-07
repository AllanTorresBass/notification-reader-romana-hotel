import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

export type ActionDispatchStatus = 'completed' | 'queued' | 'already_done';

export interface PaymentActionResult {
  entry: PaymentRegisterCacheEntry | null;
  status: ActionDispatchStatus;
}

export interface IngestNotificationResult {
  entry: PaymentRegisterCacheEntry | null;
  created: boolean;
  duplicate: boolean;
  parseFailed: boolean;
  partialParse: boolean;
}

export interface QueueProcessResult {
  processed: number;
  failed: number;
  pendingJobs: number;
}
