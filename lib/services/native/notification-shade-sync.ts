import { Platform } from 'react-native';
import type { NotificationData } from 'expo-android-notification-listener-service';

import { logger } from '@/lib/logger';
import { ingestNotificationWithFeedback } from '@/lib/feedback/ingest-notification-with-feedback';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';

export type NotificationShadeSyncResult = {
  scanned: number;
  /** Notifications persisted to local store */
  stored: number;
  /** Payment register entries created (Pagomóvil) */
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
): Promise<{ stored: number; ingested: number }> {
  let stored = 0;
  let ingested = 0;

  for (const event of events) {
    if (seenKeys.has(event.key)) {
      continue;
    }
    seenKeys.add(event.key);

    const outcome = await ingestNotificationWithFeedback(event, {
      allowedPackages: options.allowedPackages,
      retentionDays: options.retentionDays,
      captureRawPayload: options.captureRawPayload,
      source: 'notification-shade-sync',
    });

    if (outcome.stored) {
      stored += 1;
    }
    if (outcome.paymentCreated) {
      ingested += 1;
    }
  }

  return { stored, ingested };
}

export async function syncNotificationsFromShade(options: {
  allowedPackages: string[];
  retentionDays: number;
  captureRawPayload: boolean;
}): Promise<NotificationShadeSyncResult> {
  if (Platform.OS !== 'android' || options.allowedPackages.length === 0) {
    return { scanned: 0, stored: 0, ingested: 0, listenerConnected: false };
  }

  notificationListenerBridge.setAllowedPackages(options.allowedPackages);

  const listenerConnected = notificationListenerBridge.isListenerConnected();
  const active = notificationListenerBridge.getActiveNotifications();
  const seenKeys = new Set<string>();
  const activeCounts = await ingestEvents(active, seenKeys, options);

  notificationListenerBridge.syncActiveNotifications();
  const queued = notificationListenerBridge.pullQueuedNotifications();
  const queuedCounts = await ingestEvents(queued, seenKeys, options);

  const stored = activeCounts.stored + queuedCounts.stored;
  const ingested = activeCounts.ingested + queuedCounts.ingested;
  const scanned = active.length;

  if (scanned > 0 || stored > 0 || ingested > 0 || queued.length > 0) {
    logger.info('Synced notifications from shade', {
      scanned,
      stored,
      ingested,
      queued: queued.length,
      listenerConnected,
    });
  }

  return { scanned, stored, ingested, listenerConnected };
}
