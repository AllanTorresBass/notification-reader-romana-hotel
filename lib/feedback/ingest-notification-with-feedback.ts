import type { NotificationData } from 'expo-android-notification-listener-service';

import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';
import { reportCaptureNotificationDebounced } from '@/lib/feedback/capture-feedback-debouncer';
import { schedulePostCaptureSync } from '@/lib/feedback/post-capture-sync';
import { reportServiceError } from '@/lib/feedback/report-service-error';
import { logger } from '@/lib/logger';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import {
  INGEST_OUTCOME_NONE,
  type IngestNotificationOutcome,
} from '@/types/notification/ingest-outcome.types';

export async function ingestNotificationWithFeedback(
  event: NotificationData,
  options: {
    retentionDays: number;
    captureRawPayload: boolean;
    allowedPackages?: readonly string[];
    reportCapture?: boolean;
    source?: string;
  }
): Promise<IngestNotificationOutcome> {
  const allowed = options.allowedPackages ?? ALLOWED_PACKAGES;
  const source = options.source ?? 'ingestNotificationWithFeedback';

  if (!allowed.includes(event.packageName as (typeof ALLOWED_PACKAGES)[number])) {
    logger.debug('capture.funnel', {
      stage: 'rejected_whitelist',
      packageName: event.packageName,
      notificationKey: event.key,
      source,
    });
    return INGEST_OUTCOME_NONE;
  }

  try {
    const record = await notificationService.ingest(event, {
      retentionDays: options.retentionDays,
      captureRawPayload: options.captureRawPayload,
    });

    logger.debug('capture.funnel', {
      stage: 'stored',
      notificationId: record.id,
      notificationKey: record.notificationKey,
      isRedacted: record.isRedacted,
      source,
    });

    const result = await paymentRegisterService.ingestFromNotification(record);
    const pagomovilDetected = result.entry !== null || result.parseFailed;
    const paymentCreated = Boolean(result.entry && result.created);

    if (pagomovilDetected) {
      logger.info('capture.funnel', {
        stage: paymentCreated ? 'payment_created' : 'payment_skipped',
        notificationId: record.id,
        duplicate: result.duplicate,
        parseFailed: result.parseFailed,
        partialParse: result.partialParse,
        syncStatus: result.entry?.syncStatus ?? null,
        source,
      });
    } else {
      logger.debug('capture.funnel', {
        stage: 'not_pagomovil',
        notificationId: record.id,
        source,
      });
    }

    if (options.reportCapture !== false && result.entry) {
      reportCaptureNotificationDebounced(result);
    }

    if (result.entry && !result.duplicate) {
      schedulePostCaptureSync();
    }

    return {
      stored: true,
      paymentCreated,
      pagomovilDetected,
      whitelisted: true,
    };
  } catch (error) {
    logger.warn('capture.funnel', {
      stage: 'error',
      notificationKey: event.key,
      source,
    });
    reportServiceError(
      'capture_notification',
      error,
      'No se pudo procesar la notificación BDV.',
      { source }
    );
    return INGEST_OUTCOME_NONE;
  }
}
