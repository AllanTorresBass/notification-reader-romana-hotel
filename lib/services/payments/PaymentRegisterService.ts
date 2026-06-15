import type { NotificationRecord } from '@/types/notification/notification.types';
import type { ParsedPagomovil } from '@/types/payment/parsed-payment.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import type { PaymentRegisterListFilters } from '@/types/payment/payment-register-cache.types';
import type {
  IngestNotificationResult,
  PaymentActionResult,
  QueueProcessResult,
} from '@/types/payment/payment-action-result.types';
import { paymentApiService } from '@/lib/api-client/payments/PaymentApiService';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { authEvents } from '@/lib/auth/auth-events';
import { reportSyncJobFailure } from '@/lib/feedback/sync-job-feedback';
import { logger } from '@/lib/logger';
import { paymentRegisterCacheRepository } from '@/lib/services/payments/PaymentRegisterCacheRepository';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';
import {
  isPagomovilNotification,
  parsePagomovilNotification,
} from '@/lib/utils/bdv-pagomovil-parser';
import { buildDedupeKey } from '@/lib/utils/notification-normalizer';
import { notificationRecordToParseInput } from '@/lib/utils/notification-text';
import {
  cacheEntryToCreatePaymentInput,
  cacheEntryToUpdatePaymentInput,
} from '@/lib/utils/payment-register-to-api';
import { BACKEND_NAME } from '@/constants/backend';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';
import { useApiConfigStore } from '@/stores/api-config-store';
import { useApiAuthStore } from '@/stores/api-auth-store';
import { notificationRepository } from '@/lib/services/notifications/NotificationRepository';

function canSyncToRemote(entry: Pick<PaymentRegisterCacheEntry, 'pago' | 'mobile'>): boolean {
  const pago = Number.parseFloat(entry.pago);
  return !Number.isNaN(pago) && pago > 0 && Boolean(entry.mobile.trim());
}

export class PaymentRegisterService {
  async ingestFromNotification(record: NotificationRecord): Promise<IngestNotificationResult> {
    const parseInput = notificationRecordToParseInput(record);

    if (!isPagomovilNotification(parseInput)) {
      return { entry: null, created: false, duplicate: false, parseFailed: false, partialParse: false };
    }

    const parsed = parsePagomovilNotification(parseInput, record.postTime);

    const notificationKey = buildDedupeKey(record.packageName, record.notificationKey);
    const existing = await paymentRegisterCacheRepository.getByNotificationKey(notificationKey);
    if (existing?.remoteRegisterId) {
      return { entry: existing, created: false, duplicate: true, parseFailed: false, partialParse: false };
    }

    if (parsed.confidence === 'failed') {
      logger.warn('Pagomóvil notification captured but parse failed', {
        notificationId: record.id,
        title: record.title,
      });
      const entry = await paymentRegisterCacheRepository.upsert({
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
      return { entry, created: true, duplicate: false, parseFailed: true, partialParse: false };
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

    return {
      entry,
      created: true,
      duplicate: false,
      parseFailed: false,
      partialParse: parsed.confidence === 'partial',
    };
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

      const result = await this.ingestFromNotification(record);
      if (result.entry) created += 1;
    }

    if (created > 0) {
      logger.info('Reprocessed stored notifications into payment registers', { created });
    }

    return created;
  }

  /** Enqueue local cache entries that are not yet in La Romana payment_registers. */
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
  }): Promise<PaymentActionResult> {
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
    return { entry, status: 'queued' };
  }

  async confirmPayment(localId: string): Promise<PaymentActionResult> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry) return { entry: null, status: 'queued' };

    if (entry.syncStatus === 'payment_confirmed' || entry.syncStatus === 'client_assigned') {
      return { entry, status: 'already_done' };
    }

    if (entry.remoteRegisterId && useApiAuthStore.getState().isAuthenticated()) {
      try {
        const remoteId = Number.parseInt(entry.remoteRegisterId, 10);
        if (!Number.isFinite(remoteId)) {
          throw new Error('Invalid remote payment id');
        }
        await paymentApiService.update(remoteId, cacheEntryToUpdatePaymentInput(entry));
        const updated = await paymentRegisterCacheRepository.updateByLocalId(localId, {
          syncStatus: 'payment_confirmed',
          lastSyncError: null,
        });
        return { entry: updated, status: 'completed' };
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
    return { entry, status: 'queued' };
  }

  async assignClient(
    localId: string,
    clientId: string,
    clientName?: string | null
  ): Promise<PaymentActionResult> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry) return { entry: null, status: 'queued' };

    if (entry.syncStatus === 'client_assigned') {
      return { entry, status: 'already_done' };
    }

    const clientPatch = {
      assignedClientId: clientId,
      assignedClientName: clientName?.trim() || null,
    };

    await paymentRegisterCacheRepository.updateByLocalId(localId, {
      ...clientPatch,
      syncStatus: 'client_assigned',
      lastSyncError: null,
    });
    const updated = await paymentRegisterCacheRepository.getByLocalId(localId);
    return { entry: updated, status: 'completed' };
  }

  async pullRemote(): Promise<void> {
    if (!useApiAuthStore.getState().isAuthenticated()) return;

    const payments = await paymentApiService.list();
    await paymentRegisterCacheRepository.mergeRemoteEntries(
      payments.map((payment) => ({
        id: String(payment.id),
        name: payment.payerName,
        pago: payment.amount,
        mobile: payment.payerPhone ?? '',
        invoiceId: null,
        invoiceStatus: payment.status === 'confirmado' ? 'paid' : 'pending',
        notificationKey: payment.notificationKey,
      }))
    );
    useApiConfigStore.getState().setLastSyncAt(Date.now());
  }

  async processQueue(): Promise<QueueProcessResult> {
    if (!useApiAuthStore.getState().isAuthenticated()) {
      return { processed: 0, failed: 0, pendingJobs: await paymentSyncQueue.getPendingCount() };
    }

    const jobs = await paymentSyncQueue.getDueJobs();
    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.processJob(job.type, job.localId, job.payload);
        await paymentSyncQueue.removeJob(job.id);
        processed += 1;
      } catch (error) {
        failed += 1;
        const apiError = error instanceof ApiError ? error : null;
        const message = getUserErrorMessage(error, 'action', `No se pudo sincronizar con ${BACKEND_NAME}.`).message;

        reportSyncJobFailure(job.type, job.localId, error);

        if (apiError?.code === 'auth_unauthorized') {
          authEvents.emitUnauthorized();
          break;
        }

        if (apiError?.code === 'auth_forbidden') {
          await paymentRegisterCacheRepository.updateByLocalId(job.localId, {
            syncStatus: 'sync_failed',
            lastSyncError: `Permisos insuficientes en ${BACKEND_NAME}.`,
          });
          await paymentSyncQueue.removeJob(job.id);
          continue;
        }

        if (apiError?.code === 'conflict') {
          await paymentRegisterCacheRepository.updateByLocalId(job.localId, {
            syncStatus: 'synced',
            lastSyncError: null,
          });
          await paymentSyncQueue.removeJob(job.id);
          continue;
        }

        if (apiError?.code === 'validation') {
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

    return {
      processed,
      failed,
      pendingJobs: await paymentSyncQueue.getPendingCount(),
    };
  }

  private async processJob(
    type: string,
    localId: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    const entry = await paymentRegisterCacheRepository.getByLocalId(localId);
    if (!entry) return;

    if (type === 'create_register') {
      const remote = await paymentApiService.create(cacheEntryToCreatePaymentInput(entry));
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        remoteRegisterId: String(remote.id),
        remoteInvoiceId: null,
        invoiceStatus: remote.status === 'confirmado' ? 'paid' : 'pending',
        syncStatus: 'synced',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'confirm_payment') {
      if (!entry.remoteRegisterId) {
        throw new Error('Payment not synced yet');
      }
      const remoteId = Number.parseInt(entry.remoteRegisterId, 10);
      if (!Number.isFinite(remoteId)) {
        throw new Error('Invalid remote payment id');
      }
      const remote = await paymentApiService.update(remoteId, cacheEntryToUpdatePaymentInput(entry));
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        invoiceStatus: remote.status === 'confirmado' ? 'paid' : 'pending',
        syncStatus: 'payment_confirmed',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'assign_client') {
      const clientId = payload?.clientId as string | undefined;
      const clientName = payload?.clientName as string | null | undefined;
      if (!clientId) {
        throw new Error('Missing client');
      }
      await paymentRegisterCacheRepository.updateByLocalId(localId, {
        assignedClientId: clientId,
        assignedClientName: clientName ?? null,
        syncStatus: 'client_assigned',
        lastSyncError: null,
      });
      return;
    }

    if (type === 'pull_registers') {
      await this.pullRemote();
    }
  }

  async list(offset: number, limit: number, filters?: PaymentRegisterListFilters) {
    return paymentRegisterCacheRepository.listSlice(offset, limit, filters);
  }

  async getFilterCounts() {
    return paymentRegisterCacheRepository.getFilterCounts();
  }

  async clearLocalCache(): Promise<void> {
    await paymentRegisterCacheRepository.clearAll();
  }
}

export const paymentRegisterService = new PaymentRegisterService();
