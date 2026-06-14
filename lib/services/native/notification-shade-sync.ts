import { Platform } from 'react-native';
import type { NotificationData } from 'expo-android-notification-listener-service';

import { logger } from '@/lib/logger';
import { ingestNotificationWithFeedback } from '@/lib/feedback/ingest-notification-with-feedback';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';

export type NotificationShadeSyncResult = {
  scanned: number;
  ingested: number;
  listenerConnected: boolean;
};

async function ingestEvents(
  events: NotificationData[],
  seenKeys: Set<string>,
  options: {
    allowedPackages: string[];
    retentionDays: number;
    captureRawPayload: boolean;
  }
): Promise<number> {
  let ingested = 0;
  for (const event of events) {
    if (seenKeys.has(event.key)) {
      continue;
    }
    seenKeys.add(event.key);
    const saved = await ingestNotificationWithFeedback(event, {
      allowedPackages: options.allowedPackages,
      retentionDays: options.retentionDays,
      captureRawPayload: options.captureRawPayload,
      source: 'notification-shade-sync',
    });
    if (saved) {
      ingested += 1;
    }
  }
  return ingested;
}

export async function syncNotificationsFromShade(options: {
  allowedPackages: string[];
  retentionDays: number;
  captureRawPayload: boolean;
}): Promise<NotificationShadeSyncResult> {
  if (Platform.OS !== 'android' || options.allowedPackages.length === 0) {
    return { scanned: 0, ingested: 0, listenerConnected: false };
  }

  notificationListenerBridge.setAllowedPackages(options.allowedPackages);

  const listenerConnected = notificationListenerBridge.isListenerConnected();
  const active = notificationListenerBridge.getActiveNotifications();
  const seenKeys = new Set<string>();
  let ingested = await ingestEvents(active, seenKeys, options);

  notificationListenerBridge.syncActiveNotifications();
  const queued = notificationListenerBridge.pullQueuedNotifications();
  ingested += await ingestEvents(queued, seenKeys, options);

  const scanned = active.length;

  if (scanned > 0 || ingested > 0 || queued.length > 0) {
    logger.info('Synced notifications from shade', {
      scanned,
      ingested,
      queued: queued.length,
      listenerConnected,
    });
  }

  return { scanned, ingested, listenerConnected };
}
