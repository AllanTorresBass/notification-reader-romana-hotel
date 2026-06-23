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

async function invalidateCaptureQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  outcome: { stored: boolean; paymentCreated: boolean }
): Promise<void> {
  if (!outcome.stored && !outcome.paymentCreated) {
    return;
  }

  if (outcome.stored) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
  }
  if (outcome.paymentCreated) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
  }
}

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

      if (shade.stored > 0 || shade.ingested > 0) {
        if (shade.stored > shade.ingested) {
          await paymentRegisterService.reprocessStoredNotifications();
        }
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
    void notificationListenerBridge.ensureListenerConnection();
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
        const outcome = await ingestNotificationWithFeedback(event, {
          retentionDays,
          captureRawPayload,
          source: 'notification-listener',
        });
        await invalidateCaptureQueries(queryClient, outcome);
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
        void notificationListenerBridge.ensureListenerConnection().then((connected) => {
          if (connected) {
            void flushQueuedNotifications();
          }
        });
      }
    });
    return () => sub.remove();
  }, [flushQueuedNotifications]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const reconnect = () => {
      void notificationListenerBridge.ensureListenerConnection({ timeoutMs: 3000 }).then(
        (connected) => {
          if (connected) {
            void flushQueuedNotifications();
          }
        }
      );
    };

    const interval = setInterval(reconnect, 5000);
    return () => clearInterval(interval);
  }, [flushQueuedNotifications]);
}
