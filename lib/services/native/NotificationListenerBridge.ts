import { Platform } from 'react-native';
import ExpoAndroidNotificationListenerService, {
  type NotificationData,
} from 'expo-android-notification-listener-service';
import type { EventSubscription } from 'expo-modules-core';

import { logger } from '@/lib/logger';

export class NotificationListenerBridge {
  isSupported(): boolean {
    return Platform.OS === 'android';
  }

  async isAccessGranted(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    try {
      return ExpoAndroidNotificationListenerService.isNotificationPermissionGranted();
    } catch (error) {
      logger.error('Failed to check notification access', { error: String(error) });
      return false;
    }
  }

  openAccessSettings(): void {
    if (!this.isSupported()) {
      return;
    }
    ExpoAndroidNotificationListenerService.openNotificationListenerSettings();
  }

  setAllowedPackages(packages: string[]): void {
    if (!this.isSupported()) {
      return;
    }
    ExpoAndroidNotificationListenerService.setAllowedPackages(packages);
  }

  pullQueuedNotifications(): NotificationData[] {
    if (!this.isSupported()) {
      return [];
    }
    try {
      const mod = ExpoAndroidNotificationListenerService as typeof ExpoAndroidNotificationListenerService & {
        pullQueuedNotifications?: () => NotificationData[];
      };
      if (typeof mod.pullQueuedNotifications !== 'function') {
        return [];
      }
      return mod.pullQueuedNotifications();
    } catch (error) {
      logger.error('Failed to pull queued notifications', { error: String(error) });
      return [];
    }
  }

  syncActiveNotifications(): number {
    if (!this.isSupported()) {
      return 0;
    }
    try {
      const mod = ExpoAndroidNotificationListenerService as typeof ExpoAndroidNotificationListenerService & {
        syncActiveNotifications?: () => number;
      };
      if (typeof mod.syncActiveNotifications !== 'function') {
        return 0;
      }
      return mod.syncActiveNotifications();
    } catch (error) {
      logger.error('Failed to sync active notifications', { error: String(error) });
      return 0;
    }
  }

  getActiveNotifications(): NotificationData[] {
    if (!this.isSupported()) {
      return [];
    }
    try {
      const mod = ExpoAndroidNotificationListenerService as typeof ExpoAndroidNotificationListenerService & {
        getActiveNotifications?: () => NotificationData[];
      };
      if (typeof mod.getActiveNotifications !== 'function') {
        return [];
      }
      return mod.getActiveNotifications();
    } catch (error) {
      logger.error('Failed to read active notifications from shade', { error: String(error) });
      return [];
    }
  }

  isListenerConnected(): boolean {
    if (!this.isSupported()) {
      return false;
    }
    try {
      const mod = ExpoAndroidNotificationListenerService as typeof ExpoAndroidNotificationListenerService & {
        isListenerConnected?: () => boolean;
      };
      if (typeof mod.isListenerConnected !== 'function') {
        return false;
      }
      return mod.isListenerConnected();
    } catch (error) {
      logger.error('Failed to check notification listener connection', { error: String(error) });
      return false;
    }
  }

  subscribe(
    handler: (notification: NotificationData) => void
  ): EventSubscription | null {
    if (!this.isSupported()) {
      return null;
    }
    return ExpoAndroidNotificationListenerService.addListener(
      'onNotificationReceived',
      handler
    );
  }
}

export const notificationListenerBridge = new NotificationListenerBridge();
