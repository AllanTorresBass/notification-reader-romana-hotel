import { InteractionManager } from 'react-native';

import { presentOutcomeHaptic, presentOutcomeToast } from '@/lib/feedback/present-outcome';
import { shouldSkipDuplicateReport } from '@/lib/feedback/report-dedupe';
import { resolvePresentationPolicy } from '@/lib/feedback/resolve-presentation-policy';
import { formatErrorOutcome } from '@/lib/feedback/format-operation-outcome';
import { withSyncRunMeta } from '@/lib/feedback/sync-run-context';
import { uxLogger } from '@/lib/logger';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import { appendActivityLog } from '@/stores/activity-log-store';
import type { PresentationContext } from '@/types/feedback/presentation-policy.types';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { ReportOutcomeOptions } from '@/types/feedback/report-outcome.types';

function deferNonCriticalWork(work: () => void): void {
  InteractionManager.runAfterInteractions(work);
}

function normalizeOutcome(outcome: OperationOutcome): OperationOutcome {
  if (outcome.meta?.syncRunId) {
    return outcome;
  }
  const syncRunId = withSyncRunMeta().syncRunId;
  if (!syncRunId) return outcome;
  return {
    ...outcome,
    meta: withSyncRunMeta(outcome.meta),
  };
}

export function reportOutcome(
  outcome: OperationOutcome,
  options: ReportOutcomeOptions = { toast: true, log: true, sync: true }
): OperationOutcome {
  const normalized = normalizeOutcome(outcome);

  if (
    options.log !== false &&
    shouldSkipDuplicateReport(normalized.kind, normalized.message, normalized.status)
  ) {
    return normalized;
  }

  if (options.log !== false) {
    void appendActivityLog(normalized).then((entry) => {
      if (options.sync !== false) {
        void activityLogSyncService.enqueueUpload(entry);
      }
    });
    const surfaces = options.presentationContext
      ? resolvePresentationPolicy({ kind: normalized.kind, context: options.presentationContext })
          .surfaces
      : undefined;

    uxLogger.operation({
      kind: normalized.kind,
      status: normalized.status,
      ...(surfaces ? { surfaces: surfaces.join(',') } : {}),
      ...normalized.meta,
    });
  }

  if (options.toast !== false) {
    deferNonCriticalWork(() => presentOutcomeToast(normalized));
  } else if (options.haptic !== false) {
    deferNonCriticalWork(() => presentOutcomeHaptic(normalized));
  }

  return normalized;
}

export function reportOutcomeWithPolicy(
  outcome: OperationOutcome,
  context?: PresentationContext,
  overrides?: ReportOutcomeOptions
): OperationOutcome {
  const policy = resolvePresentationPolicy({ kind: outcome.kind, context });
  return reportOutcome(outcome, {
    toast: overrides?.toast ?? policy.toast,
    log: overrides?.log ?? policy.log,
    sync: overrides?.sync ?? policy.sync,
    haptic: overrides?.haptic ?? policy.haptic,
    presentationContext: context,
  });
}

export function reportError(
  kind: OperationKind,
  error: unknown,
  fallback: string,
  context: 'fetch' | 'action' = 'action',
  options?: ReportOutcomeOptions
): OperationOutcome {
  const outcome = formatErrorOutcome(kind, error, fallback, context);
  if (options?.presentationContext) {
    return reportOutcomeWithPolicy(outcome, options.presentationContext, options);
  }
  return reportOutcome(outcome, options);
}
