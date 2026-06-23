import { Platform } from 'react-native';
import ExpoAndroidNotificationListenerService, {
  type NotificationData,
} from 'expo-android-notification-listener-service';
import type { EventSubscription } from 'expo-modules-core';

import { reportServiceError } from '@/lib/feedback/report-service-error';
import { copy } from '@/constants/copy';

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
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.isAccessGranted' }
      );
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
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.pullQueuedNotifications' }
      );
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
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.syncActiveNotifications' }
      );
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
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.getActiveNotifications' }
      );
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
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.isListenerConnected' }
      );
      return false;
    }
  }

  requestListenerRebind(): boolean {
    if (!this.isSupported()) {
      return false;
    }
    try {
      const mod = ExpoAndroidNotificationListenerService as typeof ExpoAndroidNotificationListenerService & {
        requestListenerRebind?: () => boolean;
      };
      if (typeof mod.requestListenerRebind !== 'function') {
        return false;
      }
      return mod.requestListenerRebind();
    } catch (error) {
      reportServiceError(
        'listener_bridge_failure',
        error,
        copy.feedback.infra.listenerBridgeMessage,
        { source: 'NotificationListenerBridge.requestListenerRebind' }
      );
      return false;
    }
  }

  async ensureListenerConnection(options?: {
    timeoutMs?: number;
    intervalMs?: number;
    rebindIntervalMs?: number;
  }): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    if (!(await this.isAccessGranted())) {
      return false;
    }

    if (this.isListenerConnected()) {
      return true;
    }

    return this.waitForListenerConnection(options);
  }

  async waitForListenerConnection(options?: {
    timeoutMs?: number;
    intervalMs?: number;
    rebindIntervalMs?: number;
  }): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    const timeoutMs = options?.timeoutMs ?? 8000;
    const intervalMs = options?.intervalMs ?? 200;
    const rebindIntervalMs = options?.rebindIntervalMs ?? 1000;
    const deadline = Date.now() + timeoutMs;
    let lastRebind = 0;

    while (Date.now() < deadline) {
      if (this.isListenerConnected()) {
        return true;
      }

      const now = Date.now();
      if (now - lastRebind >= rebindIntervalMs) {
        this.requestListenerRebind();
        lastRebind = now;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return this.isListenerConnected();
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
