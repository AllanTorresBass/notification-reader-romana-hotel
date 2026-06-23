import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { ALLOWED_PACKAGES } from '@/constants/whitelist-defaults';
import { queryKeys } from '@/lib/query-keys';
import {
  syncNotificationsFromShade,
  type NotificationShadeSyncResult,
} from '@/lib/services/native/notification-shade-sync';
import { usePreferencesStore } from '@/stores/preferences-store';

export function useNotificationShadeSync() {
  const queryClient = useQueryClient();
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const captureRawPayload = usePreferencesStore((s) => s.captureRawPayload);

  const syncFromShade = useCallback(async (): Promise<NotificationShadeSyncResult> => {
    if (Platform.OS !== 'android') {
      return { scanned: 0, stored: 0, ingested: 0, listenerConnected: false, accessGranted: false };
    }
    const result = await syncNotificationsFromShade({
      allowedPackages: [...ALLOWED_PACKAGES],
      retentionDays,
      captureRawPayload,
    });
    if (result.stored > 0 || result.ingested > 0 || result.scanned > 0) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    }
    return result;
  }, [retentionDays, captureRawPayload, queryClient]);

  return { syncFromShade, canSync: Platform.OS === 'android' };
}
