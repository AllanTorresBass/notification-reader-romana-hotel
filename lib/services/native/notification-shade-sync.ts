import { Platform } from 'react-native';
import type { NotificationData } from 'expo-android-notification-listener-service';

import { logger } from '@/lib/logger';
import { notificationListenerBridge } from '@/lib/services/native/NotificationListenerBridge';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';

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
    const saved = await ingestIfAllowed(event, options);
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

  // Keep live listener + queue path for notifications posted after the direct read.
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

async function ingestIfAllowed(
  event: NotificationData,
  options: {
    allowedPackages: string[];
    retentionDays: number;
    captureRawPayload: boolean;
  }
): Promise<boolean> {
  if (!options.allowedPackages.includes(event.packageName)) {
    return false;
  }
  const record = await notificationService.ingest(event, {
    retentionDays: options.retentionDays,
    captureRawPayload: options.captureRawPayload,
  });
  await paymentRegisterService.ingestFromNotification(record);
  return true;
}
