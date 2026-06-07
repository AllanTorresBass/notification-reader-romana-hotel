import { copy } from '@/constants/copy';
import type { PaymentSyncResult } from '@/lib/services/payments/PaymentSyncOrchestrator';
import type { NotificationShadeSyncResult } from '@/lib/services/native/notification-shade-sync';
import {
  formatAssignClientMessages,
  formatConfirmPaymentMessages,
} from '@/lib/feedback/payment-action-messages';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { formatPagoDisplay } from '@/lib/utils/format-pago';
import type {
  ActionDispatchStatus,
  IngestNotificationResult,
  QueueProcessResult,
} from '@/types/payment/payment-action-result.types';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

const fb = copy.feedback;

function outcome(
  kind: OperationKind,
  status: OperationOutcome['status'],
  title: string,
  message: string,
  extra?: Partial<OperationOutcome>
): OperationOutcome {
  return { kind, status, title, message, ...extra };
}

function buildSyncSummary(result: PaymentSyncResult): string {
  const parts: string[] = [];
  if (result.created > 0) {
    parts.push(`${fb.sync.createdDetail(result.created)}.`);
  }
  if (result.enqueued > 0) {
    parts.push(`${fb.sync.enqueuedDetail(result.enqueued)}.`);
  }
  if (result.pulled) {
    parts.push(fb.sync.dataUpdated);
  }
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return fb.sync.upToDate(result.pendingJobs);
}

export function formatConfirmPaymentOutcome(result: {
  entry: PaymentRegisterCacheEntry | null;
  status: ActionDispatchStatus;
}): OperationOutcome {
  const { title, message } = formatConfirmPaymentMessages(result.entry, result.status);
  return outcome('confirm_payment', resultStatusToOutcome(result.status), title, message, {
    meta: { pago: result.entry?.pago ?? '' },
  });
}

export function formatAssignClientOutcome(
  result: {
    entry: PaymentRegisterCacheEntry | null;
    status: ActionDispatchStatus;
  },
  clientName?: string
): OperationOutcome {
  const { title, message } = formatAssignClientMessages(
    result.entry,
    result.status,
    clientName
  );
  return outcome('assign_client', resultStatusToOutcome(result.status), title, message, {
    meta: { clientName: clientName ?? '', pago: result.entry?.pago ?? '' },
  });
}

function resultStatusToOutcome(status: ActionDispatchStatus): OperationOutcome['status'] {
  if (status === 'already_done') return 'skipped';
  return status;
}

export function formatManualRegisterOutcome(status: ActionDispatchStatus): OperationOutcome {
  if (status === 'queued') {
    return outcome(
      'manual_register',
      'queued',
      fb.payment.manualQueuedTitle,
      fb.payment.manualQueuedMessage
    );
  }
  return outcome(
    'manual_register',
    'completed',
    fb.payment.manualCompletedTitle,
    fb.payment.manualCompletedMessage
  );
}

export function formatCaptureBatchOutcome(count: number): OperationOutcome {
  return outcome(
    'capture_notification',
    'completed',
    fb.capture.batchTitle,
    fb.capture.batchMessage(count),
    { meta: { count } }
  );
}

export function formatCaptureNotificationOutcome(
  result: IngestNotificationResult
): OperationOutcome | null {
  if (!result.entry) return null;
  if (result.duplicate) {
    return outcome(
      'capture_notification',
      'skipped',
      fb.capture.duplicateTitle,
      fb.capture.duplicateMessage
    );
  }
  if (result.parseFailed) {
    return outcome(
      'capture_notification',
      'partial',
      fb.capture.parseFailedTitle,
      fb.capture.parseFailedMessage,
      { actionLabel: fb.capture.manualAction, actionRoute: '/(tabs)/feed' }
    );
  }
  if (result.partialParse) {
    return outcome(
      'capture_notification',
      'partial',
      fb.capture.partialTitle,
      fb.capture.partialMessage,
      { meta: { pago: result.entry.pago } }
    );
  }
  if (result.created) {
    const amount = `Bs. ${formatPagoDisplay(result.entry.pago)}`;
    return outcome(
      'capture_notification',
      'completed',
      fb.capture.completedTitle,
      fb.capture.completedMessage(amount),
      { meta: { pago: result.entry.pago } }
    );
  }
  return null;
}

export function formatPullSyncOutcome(result: PaymentSyncResult): OperationOutcome {
  if (result.errorMessage) {
    return outcome(
      'pull_sync',
      'failed',
      fb.sync.failedTitle,
      result.errorMessage,
      { meta: { errorCode: result.errorCode ?? 'unknown', pendingJobs: result.pendingJobs } }
    );
  }
  if (result.durationMs === 0 && result.created === 0 && result.enqueued === 0 && !result.pulled) {
    return outcome(
      'background_sync',
      'skipped',
      fb.sync.inFlightTitle,
      fb.sync.inFlightMessage
    );
  }
  return outcome('pull_sync', 'completed', fb.sync.completeTitle, buildSyncSummary(result), {
    meta: {
      created: result.created,
      enqueued: result.enqueued,
      pendingJobs: result.pendingJobs,
      durationMs: result.durationMs,
    },
  });
}

export function formatShadeSyncOutcome(
  result: NotificationShadeSyncResult,
  options?: { includeSync?: boolean }
): OperationOutcome {
  if (!result.listenerConnected) {
    return outcome(
      'shade_sync',
      'failed',
      fb.notifications.serviceDownTitle,
      fb.notifications.serviceDownMessage
    );
  }
  if (result.scanned === 0) {
    return outcome(
      'shade_sync',
      'skipped',
      fb.notifications.emptyTitle,
      fb.notifications.emptyMessage
    );
  }
  if (result.ingested === 0) {
    return outcome(
      'shade_sync',
      'skipped',
      fb.notifications.noChangesTitle,
      fb.notifications.noChangesMessage(result.scanned)
    );
  }
  const title = options?.includeSync
    ? fb.notifications.importedWithSyncTitle
    : fb.notifications.importedTitle;
  return outcome(
    'shade_sync',
    'completed',
    title,
    fb.notifications.importedMessage(result.scanned, result.ingested),
    { meta: { scanned: result.scanned, ingested: result.ingested } }
  );
}

export function formatQueueRetryOutcome(result: QueueProcessResult): OperationOutcome {
  if (result.failed > 0) {
    return outcome(
      'queue_retry',
      'partial',
      fb.queue.partialTitle,
      fb.queue.partialMessage(result.processed, result.failed, result.pendingJobs),
      { meta: { ...result } }
    );
  }
  if (result.processed === 0 && result.pendingJobs === 0) {
    return outcome('queue_retry', 'skipped', fb.queue.emptyTitle, fb.queue.emptyMessage);
  }
  return outcome(
    'queue_retry',
    'completed',
    fb.queue.completedTitle,
    fb.queue.completedMessage(result.processed, result.pendingJobs),
    { meta: { ...result } }
  );
}

export function formatRescanBdvOutcome(input: {
  shade: NotificationShadeSyncResult;
  syncCreated: number;
}): OperationOutcome {
  if (!input.shade.listenerConnected) {
    return outcome(
      'rescan_bdv',
      'failed',
      fb.notifications.serviceDownTitle,
      fb.notifications.serviceDownShort
    );
  }
  if (input.shade.scanned === 0) {
    return outcome(
      'rescan_bdv',
      'skipped',
      fb.notifications.emptyTitle,
      fb.notifications.emptyMessage
    );
  }
  return outcome(
    'rescan_bdv',
    'completed',
    fb.notifications.rescanCompletedTitle,
    fb.notifications.rescanCompletedMessage(
      input.shade.scanned,
      input.shade.ingested,
      input.syncCreated
    ),
    {
      meta: {
        scanned: input.shade.scanned,
        ingested: input.shade.ingested,
        created: input.syncCreated,
      },
    }
  );
}

export function formatErrorOutcome(
  kind: OperationKind,
  error: unknown,
  fallback: string,
  context: 'fetch' | 'action' = 'action'
): OperationOutcome {
  const { title, message } = getUserErrorMessage(error, context, fallback);
  return outcome(kind, 'failed', title, message);
}

export function formatLoginOutcome(success: boolean, error?: unknown): OperationOutcome {
  if (success) {
    return outcome('login', 'completed', fb.session.loginTitle, fb.session.loginMessage);
  }
  return formatErrorOutcome(
    'login',
    error ?? new Error('Login failed'),
    fb.session.loginFallback
  );
}

export function formatLogoutOutcome(): OperationOutcome {
  return outcome('logout', 'completed', fb.session.logoutTitle, fb.session.logoutMessage);
}

export function formatClearCacheOutcome(): OperationOutcome {
  return outcome(
    'clear_cache',
    'completed',
    fb.storage.cacheClearedTitle,
    fb.storage.cacheClearedMessage
  );
}

export function formatClearHistoryOutcome(): OperationOutcome {
  return outcome(
    'clear_history',
    'completed',
    fb.storage.historyClearedTitle,
    fb.storage.historyClearedMessage
  );
}

export function formatPurgeRetentionOutcome(removed: number): OperationOutcome {
  return outcome(
    'purge_retention',
    'completed',
    fb.storage.retentionAppliedTitle,
    fb.storage.retentionAppliedMessage(removed)
  );
}

export function formatCreateClientOutcome(clientName: string): OperationOutcome {
  return outcome(
    'create_client',
    'completed',
    fb.client.createdTitle,
    fb.client.createdMessage(clientName)
  );
}

export function formatTestConnectionOutcome(result: PaymentSyncResult): OperationOutcome {
  if (result.errorMessage) {
    return formatErrorOutcome(
      'test_connection',
      new Error(result.errorMessage),
      fb.connection.failedFallback,
      'fetch'
    );
  }
  if (!result.authenticated) {
    return outcome(
      'test_connection',
      'partial',
      fb.connection.partialTitle,
      fb.connection.partialMessage
    );
  }
  return outcome(
    'test_connection',
    'completed',
    fb.connection.okTitle,
    fb.connection.okMessage(result.pendingJobs, result.durationMs),
    { meta: { pendingJobs: result.pendingJobs, durationMs: result.durationMs } }
  );
}

export function formatAccessCheckOutcome(hasAccess: boolean): OperationOutcome {
  if (hasAccess) {
    return outcome(
      'access_check',
      'completed',
      fb.onboarding.accessGrantedTitle,
      fb.onboarding.accessGrantedMessage
    );
  }
  return outcome(
    'access_check',
    'failed',
    fb.onboarding.accessDeniedTitle,
    fb.onboarding.accessDeniedMessage
  );
}

export function formatOnboardingSkipOutcome(): OperationOutcome {
  return outcome(
    'onboarding_skip',
    'partial',
    fb.onboarding.skipConnectTitle,
    fb.onboarding.skipConnectMessage
  );
}

export function formatBackgroundSyncOutcome(result: PaymentSyncResult): OperationOutcome | null {
  if (result.errorMessage) {
    return formatPullSyncOutcome(result);
  }
  if (result.created > 0) {
    return outcome(
      'background_sync',
      'completed',
      fb.sync.backgroundTitle,
      fb.sync.backgroundMessage(result.created),
      { meta: { created: result.created } }
    );
  }
  return null;
}

export function formatPackageHistoryRemovedOutcome(): OperationOutcome {
  return outcome(
    'clear_history',
    'completed',
    fb.notifications.packageHistoryRemovedTitle,
    fb.notifications.packageHistoryRemovedMessage
  );
}
