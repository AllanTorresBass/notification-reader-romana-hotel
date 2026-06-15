import { selectAuthStatus, selectTokenExpiresInMs } from '@/lib/auth/auth-selectors';
import { authEvents, type SyncErrorCode } from '@/lib/auth/auth-events';
import { reportServiceError } from '@/lib/feedback/report-service-error';
import { beginSyncRun, endSyncRun } from '@/lib/feedback/sync-run-context';
import { logger } from '@/lib/logger';
import { waitForApiStoresHydration } from '@/lib/storage/wait-for-persist-hydration';
import { authApiService } from '@/lib/api-client/auth/AuthApiService';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';
import { BACKEND_NAME } from '@/constants/backend';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { useApiAuthStore } from '@/stores/api-auth-store';
import { useApiConfigStore } from '@/stores/api-config-store';

export type PaymentSyncReason =
  | 'startup'
  | 'app_active'
  | 'login'
  | 'manual'
  | 'notification';

export interface PaymentSyncResult {
  reason: PaymentSyncReason;
  authenticated: boolean;
  created: number;
  enqueued: number;
  pendingJobs: number;
  pulled: boolean;
  durationMs: number;
  errorCode: SyncErrorCode | null;
  errorMessage: string | null;
  syncRunId: string;
}

const REMOTE_SYNC_MIN_INTERVAL_MS = 30_000;

const REASON_PRIORITY: Record<PaymentSyncReason, number> = {
  startup: 0,
  app_active: 1,
  notification: 2,
  login: 3,
  manual: 4,
};

let syncInFlight = false;
let inFlightPromise: Promise<PaymentSyncResult> | null = null;
let pendingFollowUp: PaymentSyncReason | null = null;
let lastRemoteSyncAt = 0;

function mergeFollowUpReason(
  current: PaymentSyncReason | null,
  next: PaymentSyncReason
): PaymentSyncReason {
  if (!current) return next;
  return REASON_PRIORITY[next] > REASON_PRIORITY[current] ? next : current;
}

function shouldRunRemoteSync(reason: PaymentSyncReason): boolean {
  if (reason === 'manual' || reason === 'login' || reason === 'notification') return true;
  return Date.now() - lastRemoteSyncAt >= REMOTE_SYNC_MIN_INTERVAL_MS;
}

function isUserInitiatedReason(reason: PaymentSyncReason): boolean {
  return reason === 'manual' || reason === 'login';
}

export class PaymentSyncOrchestrator {
  async runSync(reason: PaymentSyncReason): Promise<PaymentSyncResult> {
    if (syncInFlight && inFlightPromise) {
      pendingFollowUp = mergeFollowUpReason(pendingFollowUp, reason);
      logger.debug('Payment sync coalesced', { reason, pendingFollowUp });

      if (isUserInitiatedReason(reason)) {
        const result = await inFlightPromise;
        const followUp = pendingFollowUp;
        pendingFollowUp = null;
        if (followUp) {
          return this.runSync(followUp);
        }
        return result;
      }

      return inFlightPromise;
    }

    syncInFlight = true;
    inFlightPromise = this.executeSync(reason);

    try {
      const result = await inFlightPromise;
      const followUp = pendingFollowUp;
      pendingFollowUp = null;

      if (followUp) {
        return this.runSync(followUp);
      }

      return result;
    } finally {
      syncInFlight = false;
      inFlightPromise = null;
    }
  }

  private async executeSync(reason: PaymentSyncReason): Promise<PaymentSyncResult> {
    const syncRunId = beginSyncRun();
    const startedAt = Date.now();
    let errorCode: SyncErrorCode | null = null;
    let errorMessage: string | null = null;
    let created = 0;
    let enqueued = 0;
    let pulled = false;

    try {
      await waitForApiStoresHydration();
      useApiAuthStore.getState().expireIfNeeded();

      created = await paymentRegisterService.reprocessStoredNotifications();

      const authenticated = useApiAuthStore.getState().isAuthenticated();
      if (!authenticated) {
        return this.buildResult({
          reason,
          authenticated: false,
          created,
          enqueued: 0,
          pulled: false,
          startedAt,
          errorCode: null,
          errorMessage: null,
          syncRunId,
        });
      }

      if (!shouldRunRemoteSync(reason)) {
        logger.debug('Remote sync skipped by throttle', {
          reason,
          elapsedMs: Date.now() - lastRemoteSyncAt,
        });
        return this.buildResult({
          reason,
          authenticated: true,
          created,
          enqueued: 0,
          pulled: false,
          startedAt,
          errorCode: null,
          errorMessage: null,
          syncRunId,
        });
      }

      try {
        await authApiService.pingMe();
      } catch (error) {
        const apiError = error instanceof ApiError ? error : null;
        errorCode = apiError?.code ?? 'auth_unauthorized';
        errorMessage = getUserErrorMessage(error, 'action', 'Sesión inválida.').message;
        useApiAuthStore.getState().setLastSyncError(errorMessage);
        reportServiceError('session_expired', error, errorMessage, {
          source: 'PaymentSyncOrchestrator.pingMe',
          reason,
          toast: false,
        });
        return this.buildResult({
          reason,
          authenticated: false,
          created,
          enqueued: 0,
          pulled: false,
          startedAt,
          errorCode,
          errorMessage,
          syncRunId,
        });
      }

      enqueued = await paymentRegisterService.syncPendingRegisters();
      await paymentRegisterService.processQueue();
      await paymentRegisterService.pullRemote();
      pulled = true;
      lastRemoteSyncAt = Date.now();
      useApiAuthStore.getState().setLastSyncError(null);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      errorCode = apiError?.code ?? 'unknown';
      errorMessage = getUserErrorMessage(error, 'action', `No se pudo sincronizar con ${BACKEND_NAME}.`).message;
      useApiAuthStore.getState().setLastSyncError(errorMessage);
      logger.warn('Payment sync orchestrator failed', { reason, errorCode, errorMessage });
    } finally {
      endSyncRun();
    }

    return this.buildResult({
      reason,
      authenticated: useApiAuthStore.getState().isAuthenticated(),
      created,
      enqueued,
      pulled,
      startedAt,
      errorCode,
      errorMessage,
      syncRunId,
    });
  }

  private async buildResult(input: {
    reason: PaymentSyncReason;
    authenticated: boolean;
    created: number;
    enqueued: number;
    pulled: boolean;
    startedAt: number;
    errorCode: SyncErrorCode | null;
    errorMessage: string | null;
    syncRunId: string;
  }): Promise<PaymentSyncResult> {
    const pendingJobs = await paymentSyncQueue.getPendingCount();
    const result: PaymentSyncResult = {
      reason: input.reason,
      authenticated: input.authenticated,
      created: input.created,
      enqueued: input.enqueued,
      pendingJobs,
      pulled: input.pulled,
      durationMs: Date.now() - input.startedAt,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      syncRunId: input.syncRunId,
    };

    logger.info('Payment sync completed', {
      reason: result.reason,
      authenticated: result.authenticated,
      created: result.created,
      enqueued: result.enqueued,
      pendingJobs: result.pendingJobs,
      pulled: result.pulled,
      durationMs: result.durationMs,
      syncRunId: result.syncRunId,
      baseUrl: useApiConfigStore.getState().baseUrl,
      authStatus: selectAuthStatus(useApiAuthStore.getState()),
      tokenExpiresInMs: selectTokenExpiresInMs(useApiAuthStore.getState()),
      errorCode: result.errorCode,
    });

    return result;
  }
}

export const paymentSyncOrchestrator = new PaymentSyncOrchestrator();

/** @internal Resets module state between tests. */
export function resetPaymentSyncOrchestratorForTests(): void {
  syncInFlight = false;
  inFlightPromise = null;
  pendingFollowUp = null;
  lastRemoteSyncAt = 0;
}

authEvents.onUnauthorized(() => {
  useApiAuthStore.getState().setLastSyncError('Sesión expirada — inicia sesión de nuevo.');
  reportServiceError(
    'session_expired',
    new Error('Sesión expirada'),
    'Sesión expirada — inicia sesión de nuevo.',
    { source: 'authEvents.onUnauthorized', toast: false }
  );
});
