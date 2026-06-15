import { classifyError } from '@/lib/errors/classify-error';
import {
  formatActivityLogSyncFailureOutcome,
  formatErrorOutcome,
  formatListenerBridgeFailureOutcome,
  formatSessionExpiredOutcome,
  formatStorageFailureOutcome,
  formatSyncJobFailedOutcome,
  formatUnhandledExceptionOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { withSyncRunMeta } from '@/lib/feedback/sync-run-context';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';

export interface ServiceErrorContext {
  source: string;
  entityType?: 'payment' | 'notification' | 'job';
  entityId?: string;
  reason?: string;
  jobType?: string;
  toast?: boolean;
  sync?: boolean;
}

function attachMeta(
  outcome: OperationOutcome,
  context: ServiceErrorContext,
  error: unknown
): OperationOutcome {
  const classified = classifyError(error);
  return {
    ...outcome,
    meta: withSyncRunMeta({
      ...outcome.meta,
      errorCode: classified.errorCode,
      category: classified.category,
      recoverable: classified.recoverable,
      source: context.source,
      ...(context.entityType ? { entityType: context.entityType } : {}),
      ...(context.entityId ? { entityId: context.entityId } : {}),
      ...(context.reason ? { reason: context.reason } : {}),
      ...(context.jobType ? { jobType: context.jobType } : {}),
    }),
  };
}

export function reportServiceError(
  kind: OperationKind,
  error: unknown,
  fallback: string,
  context: ServiceErrorContext
): OperationOutcome {
  let outcome: OperationOutcome;

  switch (kind) {
    case 'listener_bridge_failure':
      outcome = formatListenerBridgeFailureOutcome(fallback);
      break;
    case 'storage_failure':
      outcome = formatStorageFailureOutcome(fallback);
      break;
    case 'session_expired':
      outcome = formatSessionExpiredOutcome();
      break;
    case 'activity_log_sync':
      outcome = formatActivityLogSyncFailureOutcome(fallback);
      break;
    case 'sync_job_failed':
      outcome = formatSyncJobFailedOutcome(fallback, context.jobType);
      break;
    case 'unhandled_exception':
      outcome = formatUnhandledExceptionOutcome(fallback);
      break;
    default:
      outcome = formatErrorOutcome(kind, error, fallback, 'action');
      break;
  }

  return reportOutcome(attachMeta(outcome, context, error), {
    toast: context.toast ?? false,
    log: true,
    sync: context.sync ?? (kind !== 'activity_log_sync' && kind !== 'storage_failure'),
  });
}
