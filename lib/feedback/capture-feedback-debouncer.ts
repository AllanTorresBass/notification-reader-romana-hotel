import { formatCaptureNotificationOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import type { IngestNotificationResult } from '@/types/payment/payment-action-result.types';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCount = 0;

export function reportCaptureNotificationDebounced(result: IngestNotificationResult): void {
  const outcome = formatCaptureNotificationOutcome(result);
  if (!outcome) return;

  if (outcome.status === 'skipped') {
    reportOutcome(outcome, { toast: true, log: true });
    return;
  }

  pendingCount += 1;
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const count = pendingCount;
    pendingCount = 0;
    debounceTimer = null;

    if (count > 1) {
      reportOutcome(
        {
          kind: 'capture_notification',
          status: 'completed',
          title: 'Nuevos pagos detectados',
          message: `${count} pagos importados desde notificaciones BDV.`,
          meta: { count },
        },
        { toast: true, log: true }
      );
      return;
    }

    reportOutcome(outcome, { toast: true, log: true });
  }, 2000);
}
