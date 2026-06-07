import { uxLogger } from '@/lib/logger';
import { presentOutcomeToast } from '@/lib/feedback/present-outcome';
import { appendActivityLog } from '@/stores/activity-log-store';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import { formatErrorOutcome } from '@/lib/feedback/format-operation-outcome';
import { InteractionManager } from 'react-native';

export interface ReportOutcomeOptions {
  toast?: boolean;
  log?: boolean;
  sync?: boolean;
}

function deferNonCriticalWork(work: () => void): void {
  InteractionManager.runAfterInteractions(work);
}

export function reportOutcome(
  outcome: OperationOutcome,
  options: ReportOutcomeOptions = { toast: true, log: true, sync: true }
): OperationOutcome {
  if (options.log !== false) {
    void appendActivityLog(outcome).then((entry) => {
      if (options.sync !== false) {
        void activityLogSyncService.enqueueUpload(entry);
      }
    });
    uxLogger.operation({
      kind: outcome.kind,
      status: outcome.status,
      ...outcome.meta,
    });
  }
  if (options.toast !== false) {
    deferNonCriticalWork(() => presentOutcomeToast(outcome));
  }
  return outcome;
}

export function reportError(
  kind: OperationKind,
  error: unknown,
  fallback: string,
  context: 'fetch' | 'action' = 'action',
  options?: ReportOutcomeOptions
): OperationOutcome {
  return reportOutcome(formatErrorOutcome(kind, error, fallback, context), options);
}
