import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import type {
  PaymentFailureClass,
  PaymentFailureStage,
} from '@/types/payment/payment-sync-failure.types';
import type { SyncStatus } from '@/types/payment/payment-register-cache.types';

export function failureFromApiError(error: unknown): PaymentFailureClass {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'auth_unauthorized':
        return 'auth_required';
      case 'auth_forbidden':
        return 'forbidden';
      case 'validation':
        return 'validation_error';
      case 'conflict':
        return 'duplicate_key';
      case 'network':
        return 'network_error';
      default:
        return 'unknown';
    }
  }
  return 'unknown';
}

export interface SyncFailurePatch {
  syncStatus: SyncStatus;
  failureClass: PaymentFailureClass;
  failureStage: PaymentFailureStage;
  lastSyncError: string;
}

export function syncFailurePatch(
  failureClass: PaymentFailureClass,
  failureStage: PaymentFailureStage,
  message: string
): SyncFailurePatch {
  return {
    syncStatus: 'sync_failed',
    failureClass,
    failureStage,
    lastSyncError: message,
  };
}

export function syncSuccessFields(): {
  failureClass: null;
  failureStage: null;
  lastSyncError: null;
} {
  return {
    failureClass: null,
    failureStage: null,
    lastSyncError: null,
  };
}
