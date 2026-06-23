import type { NotificationShadeSyncResult } from '@/lib/services/native/notification-shade-sync';
import { formatShadeSyncOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import type { ReportOutcomeOptions } from '@/types/feedback/report-outcome.types';

export function shouldReportShadeSyncOutcome(result: NotificationShadeSyncResult): boolean {
  if (result.stored > 0 || result.ingested > 0) return true;
  if (!result.accessGranted) return true;
  if (!result.listenerConnected && result.scanned === 0) return false;
  if (result.scanned > 0) return true;
  return false;
}

export function reportShadeSyncOutcomeIfNeeded(
  result: NotificationShadeSyncResult,
  options?: ReportOutcomeOptions & { includeSync?: boolean }
): void {
  if (!shouldReportShadeSyncOutcome(result)) return;

  const { includeSync, ...reportOptions } = options ?? {};
  reportOutcome(formatShadeSyncOutcome(result, { includeSync }), {
    toast: result.ingested > 0,
    log: true,
    ...reportOptions,
  });
}
