import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { NotificationData } from 'expo-android-notification-listener-service';

import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';
import { reportCaptureNotificationDebounced } from '@/lib/feedback/capture-feedback-debouncer';
import { formatShadeSyncOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';
import { syncNotificationsFromShade } from '@/lib/services/native/notification-shade-sync';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { usePreferencesStore } from '@/stores/preferences-store';

async function ingestIfAllowed(
  event: NotificationData,
  retentionDays: number,
  captureRawPayload: boolean
): Promise<boolean> {
  if (!ALLOWED_PACKAGES.includes(event.packageName as (typeof ALLOWED_PACKAGES)[number])) {
    logger.debug('Skipped notification (not Banco de Venezuela)', { packageName: event.packageName });
    return false;
  }
  const record = await notificationService.ingest(event, { retentionDays, captureRawPayload });
  const result = await paymentRegisterService.ingestFromNotification(record);
  if (result.entry) {
    reportCaptureNotificationDebounced(result);
  }
  return Boolean(result.entry);
}

export function useNotificationListener() {
  const queryClient = useQueryClient();
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const captureRawPayload = usePreferencesStore((s) => s.captureRawPayload);

  const flushQueuedNotifications = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const shade = await syncNotificationsFromShade({
      allowedPackages: [...ALLOWED_PACKAGES],
      retentionDays,
      captureRawPayload,
    });
    if (shade.ingested > 0) {
      await paymentRegisterService.reprocessStoredNotifications();
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      reportOutcome(formatShadeSyncOutcome(shade), { toast: true, log: true });
    } else if (shade.scanned > 0) {
      reportOutcome(formatShadeSyncOutcome(shade), { toast: false, log: true });
    }
  }, [retentionDays, captureRawPayload, queryClient]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    notificationListenerBridge.setAllowedPackages([...ALLOWED_PACKAGES]);
  }, []);

  useEffect(() => {
    void flushQueuedNotifications();
  }, [flushQueuedNotifications]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = notificationListenerBridge.subscribe(async (event) => {
      const ingested = await ingestIfAllowed(event, retentionDays, captureRawPayload);
      if (ingested) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      }
    });

    return () => {
      subscription?.remove();
      void notificationService.flush();
    };
  }, [retentionDays, captureRawPayload, queryClient]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushQueuedNotifications();
      }
    });
    return () => sub.remove();
  }, [flushQueuedNotifications, queryClient]);
}
