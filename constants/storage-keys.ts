/** expo-secure-store keys: alphanumeric, ".", "-", "_" only (no colons). */
export const STORAGE_KEYS = {
  notifications: 'nr.notifications.v1',
  preferences: 'nr.preferences.v1',
  whitelist: 'nr.whitelist.v1',
  meta: 'nr.meta.v1',
  paymentRegisters: 'nr.payment-registers.v1',
  paymentSyncQueue: 'nr.payment-sync-queue.v1',
  apiConfig: 'nr.api-config.v1',
} as const;

export const STORAGE_VERSION = 1;

export const MAX_NOTIFICATION_RECORDS = 500;
export const MAX_PAYMENT_REGISTER_ENTRIES = 500;

export const DEFAULT_RETENTION_DAYS = 30;

export const NOTIFICATION_PAGE_SIZE = 20;

export const STORAGE_WRITE_DEBOUNCE_MS = 200;
