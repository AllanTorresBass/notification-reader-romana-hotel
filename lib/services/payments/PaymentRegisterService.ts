import type { NotificationRecord } from '@/types/notification/notification.types';
import type { ParsedPagomovil } from '@/types/payment/parsed-payment.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import { paymentRegisterApiService } from '@/lib/api-client/payment-registers/PaymentRegisterApiService';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { authEvents } from '@/lib/auth/auth-events';
import { logger } from '@/lib/logger';
import { paymentRegisterCacheRepository } from '@/lib/services/payments/PaymentRegisterCacheRepository';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';
import {
  isPagomovilNotification,
  parsePagomovilNotification,
} from '@/lib/utils/bdv-pagomovil-parser';
import { buildDedupeKey } from '@/lib/utils/notification-normalizer';
import { notificationRecordToParseInput } from '@/lib/utils/notification-text';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { useApiConfigStore } from '@/stores/api-config-store';
import { useApiAuthStore } from '@/stores/api-auth-store';
import { notificationRepository } from '@/lib/services/notifications/NotificationRepository';

function canSyncToRemote(entry: Pick<PaymentRegisterCacheEntry, 'pago' | 'mobile'>): boolean {
  const pago = Number.parseFloat(entry.pago);
  return !Number.isNaN(pago) && pago > 0 && Boolean(entry.mobile.trim());
}

export class PaymentRegisterService {
  async ingestFromNotification(record: NotificationRecord): Promise<PaymentRegisterCacheEntry | null> {
    const parseInput = notificationRecordToParseInput(record);

    if (!isPagomovilNotification(parseInput)) {
      return null;
    }

    const parsed = parsePagomovilNotification(parseInput, record.postTime);

    const notificationKey = buildDedupeKey(record.packageName, record.notificationKey);
    const existing = await paymentRegisterCacheRepository.getByNotificationKey(notificationKey);
    if (existing?.remoteRegisterId) {
      return existing;
    }

    if (parsed.confidence === 'failed') {
      logger.warn('Pagomóvil notification captured but parse failed', {
        notificationId: record.id,
        title: record.title,
      });
      return paymentRegisterCacheRepository.upsert({
        name: null,
        pago: '0.00',
        mobile: 'sin-leer',
        ref: '',
        paymentDate: '',
        paymentTime: '',
        notificationKey,
        notificationId: record.id,
        syncStatus: 'sync_failed',
        lastSyncError: 'No se pudo leer el texto. Complete manualmente.',
      });
    }

    const pago = parsed.pago || '0.00';
    const mobile = parsed.mobile || 'sin-leer';

    const entry = await paymentRegisterCacheRepository.upsert({
      name: parsed.name,
      pago,
      mobile,
      ref: parsed.ref,
      paymentDate: parsed.paymentDate,
      paymentTime: parsed.paymentTime,
      notificationKey,
      notificationId: record.id,
      syncStatus: parsed.confidence === 'high' ? 'pending_sync' : 'sync_failed',
      lastSyncError:
        parsed.confidence === 'partial'
          ? 'Parse parcial — confirme ref/fecha/hora antes de sincronizar.'
          : null,
    });

    await this.enqueueCreateRegisterIfNeeded(entry);

    return entry;
  }

  /** Re-process stored BDV notifications (e.g. after app update or missed parse). */
  async reprocessStoredNotifications(): Promise<number> {
    const records = await notificationRepository.getAllValidated();
    let created = 0;

    for (const record of records) {
      const key = buildDedupeKey(record.packageName, record.notificationKey);
      const existing = await paymentRegisterCacheRepository.getByNotificationKey(key);
      if (existing) {
        continue;
      }

      const entry = await this.ingestFromNotification(record);
      if (entry) created += 1;
    }

    if (created > 0) {
      logger.info('Reprocessed stored notifications into payment registers', { created });
    }

    return created;
  }

  /** Enqueue local cache entries that are not yet in kd-gym payment_registers. */
  async syncPendingRegisters(): Promise<number> {
    const { items } = await paymentRegisterCacheRepository.listSlice(0, 500);
    let enqueued = 0;

    for (const entry of items) {
      if (entry.remoteRegisterId || !canSyncToRemote(entry)) {
        continue;
      }
      await paymentSyncQueue.enqueue('create_register', entry.localId);
      enqueued += 1;
    }

    if (enqueued > 0 && useApiAuthStore.getState().isAuthenticated()) {
      void this.processQueue();
    }

    return enqueued;
  }

  private async enqueueCreateRegisterIfNeeded(entry: PaymentRegisterCacheEntry): Promise<void> {
    if (entry.remoteRegisterId || !canSyncToRemote(entry)) {
      return;
    }
    await paymentSyncQueue.enqueue('create_register', entry.localId);
    if (useApiAuthStore.getState().isAuthenticated()) {
      void this.processQueue();
    }
  }

  async createManual(input: {
    name: string | null;
    pago: string;
    mobile: string;
    ref: string;
    paymentDate: string;
    paymentTime: string;
  }): Promise<PaymentRegisterCacheEntry> {
    const notificationKey = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry = await paymentRegisterCacheRepository.upsert({
      name: input.name,
      pago: input.pago,
      mobile: input.mobile,
      ref: input.ref,
      paymentDate: input.paymentDate,
      paymentTime: input.paymentTime,
      notificationKey,
      notificationId: notificationKey,
      syncStatus: 'pending_sync',
    });
    await paymentSyncQueue.enqueue('create_register', entry.localId);
    if (useApiAuthStore.getState().isAuthenticated()) {
      void this.processQueue();
    }
    return entry;
  }

  async confirmPayment(localId: string): Promise<PaymentRegisterCacheEntry | null> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry) return null;

    if (entry.syncStatus === 'payment_confirmed' || entry.syncStatus === 'client_assigned') {
      return entry;
    }

    if (entry.remoteRegisterId && useApiAuthStore.getState().isAuthenticated()) {
      try {
        const remote = await paymentRegisterApiService.confirmPayment(entry.remoteRegisterId, {
          reference: entry.ref,
          paymentDate: entry.paymentDate,
          paymentTime: entry.paymentTime,
        });
        return paymentRegisterCacheRepository.updateByLocalId(localId, {
          invoiceStatus: remote.invoiceStatus,
          syncStatus: 'payment_confirmed',
          lastSyncError: null,
        });
      } catch (error) {
        const message = getUserErrorMessage(error, 'action', 'No se pudo confirmar el pago.').message;
        await paymentRegisterCacheRepository.updateByLocalId(localId, {
          lastSyncError: message,
          syncStatus: 'sync_failed',
        });
        await paymentSyncQueue.enqueue('confirm_payment', localId);
        throw error;
      }
    }

    await paymentSyncQueue.enqueue('confirm_payment', localId);
    if (useApiAuthStore.getState().isAuthenticated()) {
      void this.processQueue();
    }
    return entry;
  }

  async assignClient(localId: string, clientId: string): Promise<PaymentRegisterCacheEntry | null> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry?.remoteRegisterId) {
      await paymentSyncQueue.enqueue('assign_client', localId, { clientId });
      if (useApiAuthStore.getState().isAuthenticated()) {
        void this.processQueue();
      }
      return entry;
    }

    try {
      await paymentRegisterApiService.assignClient(entry.remoteRegisterId, clientId);
      return paymentRegisterCacheRepository.updateByLocalId(localId, {
        syncStatus: 'client_assigned',
        lastSyncError: null,
      });
    } catch (error) {
      const message = getUserErrorMessage(error, 'action', 'No se pudo asociar el cliente.').message;
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        lastSyncError: message,
        syncStatus: 'sync_failed',
      });
      await paymentSyncQueue.enqueue('assign_client', localId, { clientId });
      throw error;
    }
  }

  async pullRemote(): Promise<void> {
    if (!useApiAuthStore.getState().isAuthenticated()) return;

    const response = await paymentRegisterApiService.list(1, 100);
    await paymentRegisterCacheRepository.mergeRemoteEntries(
      response.data.map((r) => ({
        id: r.id,
        name: r.name,
        pago: r.pago,
        mobile: r.mobile,
        invoiceId: r.invoiceId,
        invoiceStatus: r.invoiceStatus,
        notificationKey: r.notificationKey,
      }))
    );
    useApiConfigStore.getState().setLastSyncAt(Date.now());
  }

  async processQueue(): Promise<void> {
    if (!useApiAuthStore.getState().isAuthenticated()) return;

    const jobs = await paymentSyncQueue.getDueJobs();
    for (const job of jobs) {
      try {
        await this.processJob(job.type, job.localId, job.payload);
        await paymentSyncQueue.removeJob(job.id);
      } catch (error) {
        const apiError = error instanceof ApiError ? error : null;
        const message = getUserErrorMessage(error, 'action', 'No se pudo sincronizar con kd-gym.').message;

        if (apiError?.code === 'auth_unauthorized') {
          authEvents.emitUnauthorized();
          break;
        }

        if (apiError?.code === 'auth_forbidden') {
          await paymentRegisterCacheRepository.updateByLocalId(job.localId, {
            syncStatus: 'sync_failed',
            lastSyncError: 'Permisos insuficientes en kd-gym.',
          });
          await paymentSyncQueue.removeJob(job.id);
          continue;
        }

        if (apiError?.code === 'conflict' || apiError?.code === 'validation') {
          await paymentRegisterCacheRepository.updateByLocalId(job.localId, {
            syncStatus: 'sync_failed',
            lastSyncError: message,
          });
          await paymentSyncQueue.removeJob(job.id);
          continue;
        }

        await paymentSyncQueue.markFailed(job, message);
        await paymentRegisterCacheRepository.updateByLocalId(job.localId, {
          syncStatus: 'sync_failed',
          lastSyncError: message,
        });
      }
    }
  }

  private async processJob(
    type: string,
    localId: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry) return;

    if (type === 'create_register') {
      const result = await paymentRegisterApiService.create({
        name: entry.name,
        pago: entry.pago,
        mobile: entry.mobile,
        notificationKey: entry.notificationKey,
      });
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        remoteRegisterId: result.register.id,
        remoteInvoiceId: result.invoiceId,
        invoiceStatus: result.register.invoiceStatus,
        syncStatus: 'synced',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'confirm_payment') {
      if (!entry.remoteRegisterId) {
        throw new Error('Register not synced yet');
      }
      const remote = await paymentRegisterApiService.confirmPayment(entry.remoteRegisterId, {
        reference: entry.ref,
        paymentDate: entry.paymentDate,
        paymentTime: entry.paymentTime,
      });
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        invoiceStatus: remote.invoiceStatus,
        syncStatus: 'payment_confirmed',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'assign_client') {
      const clientId = payload?.clientId as string | undefined;
      if (!clientId || !entry.remoteRegisterId) {
        throw new Error('Missing client or register');
      }
      await paymentRegisterApiService.assignClient(entry.remoteRegisterId, clientId);
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        syncStatus: 'client_assigned',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'pull_registers') {
      await this.pullRemote();
    }
  }

  async list(offset: number, limit: number) {
    return paymentRegisterCacheRepository.listSlice(offset, limit);
  }

  async clearLocalCache(): Promise<void> {
    await paymentRegisterCacheRepository.clearAll();
  }
}

export const paymentRegisterService = new PaymentRegisterService();
