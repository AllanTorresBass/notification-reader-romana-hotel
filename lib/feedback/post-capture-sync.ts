import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { logger } from '@/lib/logger';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced remote sync after live Pagomóvil capture.
 * Coalesces bursts of notifications into a single orchestrator run.
 */
export function schedulePostCaptureSync(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void paymentSyncOrchestrator.runSync('notification').then((result) => {
      logger.info('Post-capture sync completed', {
        created: result.created,
        enqueued: result.enqueued,
        pulled: result.pulled,
        pendingJobs: result.pendingJobs,
        durationMs: result.durationMs,
        errorCode: result.errorCode,
      });
    });
  }, 1000);
}

/** @internal Test helper */
export function resetPostCaptureSyncForTests(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
