import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';
import { ingestNotificationWithFeedback } from '@/lib/feedback/ingest-notification-with-feedback';
import { reportError } from '@/lib/feedback/report-feedback';
import { reportShadeSyncOutcomeIfNeeded } from '@/lib/feedback/shade-sync-reporting';
import { queryKeys } from '@/lib/query-keys';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';
import { syncNotificationsFromShade } from '@/lib/services/native/notification-shade-sync';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { usePreferencesStore } from '@/stores/preferences-store';

export function useNotificationListener() {
  const queryClient = useQueryClient();
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const captureRawPayload = usePreferencesStore((s) => s.captureRawPayload);

  const flushQueuedNotifications = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const shade = await syncNotificationsFromShade({
        allowedPackages: [...ALLOWED_PACKAGES],
        retentionDays,
        captureRawPayload,
      });

      if (shade.ingested > 0) {
        await paymentRegisterService.reprocessStoredNotifications();
        await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      }

      reportShadeSyncOutcomeIfNeeded(shade, {
        toast: shade.ingested > 0,
        log: true,
      });
    } catch (error) {
      reportError('shade_sync', error, 'No se pudo sincronizar notificaciones desde la barra.');
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
      try {
        const ingested = await ingestNotificationWithFeedback(event, {
          retentionDays,
          captureRawPayload,
          source: 'notification-listener',
        });
        if (ingested) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
          await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
        }
      } catch (error) {
        reportError('capture_notification', error, 'No se pudo procesar la alerta BDV.');
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
