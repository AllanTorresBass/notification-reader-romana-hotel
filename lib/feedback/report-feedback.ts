import { InteractionManager } from 'react-native';

import { presentOutcomeHaptic, presentOutcomeToast } from '@/lib/feedback/present-outcome';
import { resolvePresentationPolicy } from '@/lib/feedback/resolve-presentation-policy';
import { formatErrorOutcome } from '@/lib/feedback/format-operation-outcome';
import { uxLogger } from '@/lib/logger';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import { appendActivityLog } from '@/stores/activity-log-store';
import type { PresentationContext } from '@/types/feedback/presentation-policy.types';
import type { OperationKind, OperationOutcome } from '@/types/feedback/operation-outcome.types';

export interface ReportOutcomeOptions {
  toast?: boolean;
  log?: boolean;
  sync?: boolean;
  haptic?: boolean;
  presentationContext?: PresentationContext;
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
    const surfaces = options.presentationContext
      ? resolvePresentationPolicy({ kind: outcome.kind, context: options.presentationContext })
          .surfaces
      : undefined;

    uxLogger.operation({
      kind: outcome.kind,
      status: outcome.status,
      ...(surfaces ? { surfaces: surfaces.join(',') } : {}),
      ...outcome.meta,
    });
  }

  if (options.toast !== false) {
    deferNonCriticalWork(() => presentOutcomeToast(outcome));
  } else if (options.haptic !== false) {
    deferNonCriticalWork(() => presentOutcomeHaptic(outcome));
  }

  return outcome;
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
