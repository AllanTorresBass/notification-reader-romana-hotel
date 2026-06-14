import * as SecureStore from 'expo-secure-store';

import { appendDiagnostic } from '@/lib/diagnostics/diagnostic-ring';

async function reportStorageReadFailure(key: string, error: unknown): Promise<void> {
  appendDiagnostic('error', 'SecureStore read failed', { key, error: String(error) });

  try {
    const { reportServiceError } = await import('@/lib/feedback/report-service-error');
    reportServiceError(
      'storage_failure',
      error,
      'No se pudo leer datos guardados en el dispositivo.',
      { source: `SecureStorageClient.getJson:${key}`, toast: false }
    );
  } catch {
    // Avoid crashing if feedback layer is unavailable during bootstrap.
  }
}

async function reportStorageWriteFailure(key: string, error: unknown): Promise<void> {
  appendDiagnostic('error', 'SecureStore write failed', { key, error: String(error) });

  if (key.includes('activity-log')) {
    return;
  }

  try {
    const { reportServiceError } = await import('@/lib/feedback/report-service-error');
    reportServiceError(
      'storage_failure',
      error,
      'No se pudo guardar datos en el dispositivo.',
      { source: `SecureStorageClient.setJson:${key}`, toast: false }
    );
  } catch {
    // Avoid crashing if feedback layer is unavailable during bootstrap.
  }
}

export class SecureStorageClient {
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      void reportStorageReadFailure(key, error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      await SecureStore.setItemAsync(key, raw);
    } catch (error) {
      void reportStorageWriteFailure(key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      appendDiagnostic('error', 'SecureStore delete failed', { key, error: String(error) });
      throw error;
    }
  }
}

export const secureStorageClient = new SecureStorageClient();
