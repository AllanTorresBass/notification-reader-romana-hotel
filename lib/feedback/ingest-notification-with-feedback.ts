import type { NotificationData } from 'expo-android-notification-listener-service';

import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';
import { reportCaptureNotificationDebounced } from '@/lib/feedback/capture-feedback-debouncer';
import { reportServiceError } from '@/lib/feedback/report-service-error';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';

export async function ingestNotificationWithFeedback(
  event: NotificationData,
  options: {
    retentionDays: number;
    captureRawPayload: boolean;
    allowedPackages?: readonly string[];
    reportCapture?: boolean;
    source?: string;
  }
): Promise<boolean> {
  const allowed = options.allowedPackages ?? ALLOWED_PACKAGES;

  if (!allowed.includes(event.packageName as (typeof ALLOWED_PACKAGES)[number])) {
    return false;
  }

  try {
    const record = await notificationService.ingest(event, {
      retentionDays: options.retentionDays,
      captureRawPayload: options.captureRawPayload,
    });
    const result = await paymentRegisterService.ingestFromNotification(record);

    if (options.reportCapture !== false && result.entry) {
      reportCaptureNotificationDebounced(result);
    }

    return Boolean(result.entry);
  } catch (error) {
    reportServiceError(
      'capture_notification',
      error,
      'No se pudo procesar la notificación BDV.',
      { source: options.source ?? 'ingestNotificationWithFeedback' }
    );
    return false;
  }
}
