import {
  MAX_PAYMENT_REGISTER_ENTRIES,
  NOTIFICATION_PAGE_SIZE,
  STORAGE_KEYS,
  STORAGE_VERSION,
  STORAGE_WRITE_DEBOUNCE_MS,
} from '@/constants/storage-keys';
import { tracePaymentDatePipeline } from '@/lib/diagnostics/payment-date-trace';
import { BaseStorageRepository } from '@/lib/services/base/base-storage-repository';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';
import { logger } from '@/lib/logger';
import {
  paymentRegisterStoreEnvelopeSchema,
  repairPaymentRegisterEntry,
} from '@/types/payment/payment-register-cache.schemas';
import { mergeInvoiceStatus, mergeSyncStatus } from '@/lib/utils/merge-payment-register-state';
import { filterPaymentRegisters, getPaymentFilterCounts } from '@/lib/utils/filter-payment-registers';
import {
  normalizePaymentDate,
  normalizePaymentTime,
  resolveMergedPaymentDate,
  resolveMergedPaymentTime,
} from '@/lib/utils/format-payment-datetime';
import type { PaymentDateSource } from '@la-romana/payment-datetime';
import type {
  PaymentRegisterCacheEntry,
  PaymentRegisterFilterCounts,
  PaymentRegisterListFilters,
  PaymentRegisterListPage,
  SyncStatus,
} from '@/types/payment/payment-register-cache.types';

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeDatePatch(
  patch: Partial<Pick<PaymentRegisterCacheEntry, 'paymentDate' | 'paymentTime' | 'dateSource'>>
): Partial<Pick<PaymentRegisterCacheEntry, 'paymentDate' | 'paymentTime' | 'dateSource'>> {
  const normalized: Partial<Pick<PaymentRegisterCacheEntry, 'paymentDate' | 'paymentTime' | 'dateSource'>> = {
    ...patch,
  };
  if (patch.paymentDate !== undefined) {
    normalized.paymentDate = normalizePaymentDate(patch.paymentDate);
  }
  if (patch.paymentTime !== undefined) {
    normalized.paymentTime = normalizePaymentTime(patch.paymentTime);
  }
  return normalized;
}

export class PaymentRegisterCacheRepository extends BaseStorageRepository {
  private cache: PaymentRegisterCacheEntry[] | null = null;
  private keyIndex = new Map<string, PaymentRegisterCacheEntry>();
  private isHydrated = false;
  private migrationPersisted = false;

  private async hydrate(): Promise<PaymentRegisterCacheEntry[]> {
    if (this.cache && this.isHydrated) {
      return this.cache;
    }

    const envelope = await secureStorageClient.getJson<unknown>(STORAGE_KEYS.paymentRegisters);
    if (!envelope) {
      this.cache = [];
      this.rebuildIndex();
      this.isHydrated = true;
      return this.cache;
    }

    const parsed = paymentRegisterStoreEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      logger.warn('Invalid payment register envelope, resetting store');
      this.cache = [];
      this.rebuildIndex();
      this.isHydrated = true;
      return this.cache;
    }

    const repaired = parsed.data.entries.map(repairPaymentRegisterEntry);
    this.cache = repaired;
    this.rebuildIndex();
    this.isHydrated = true;

    const needsMigration =
      parsed.data.version < STORAGE_VERSION || repaired.some((entry, index) => {
        const raw = parsed.data.entries[index];
        return (
          entry.paymentDate !== raw.paymentDate ||
          entry.paymentTime !== raw.paymentTime ||
          entry.dateSource !== raw.dateSource
        );
      });

    if (needsMigration && !this.migrationPersisted) {
      this.migrationPersisted = true;
      logger.info('Repairing payment register cache (date/time migration)', {
        fromVersion: parsed.data.version,
        toVersion: STORAGE_VERSION,
        count: repaired.length,
      });
      await this.persistNow(repaired);
    }

    return this.cache;
  }

  private rebuildIndex(): void {
    this.keyIndex.clear();
    for (const entry of this.cache ?? []) {
      this.keyIndex.set(entry.notificationKey, entry);
    }
  }

  private capEntries(entries: PaymentRegisterCacheEntry[]): PaymentRegisterCacheEntry[] {
    return [...entries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PAYMENT_REGISTER_ENTRIES);
  }

  private async persistNow(entries: PaymentRegisterCacheEntry[]): Promise<void> {
    const envelope = { version: STORAGE_VERSION as 2, entries };
    await secureStorageClient.setJson(STORAGE_KEYS.paymentRegisters, envelope);
    this.cache = entries;
    this.rebuildIndex();
  }

  private schedulePersist(entries: PaymentRegisterCacheEntry[]): void {
    this.scheduleDebouncedWrite(async () => {
      await this.persistNow(entries);
    }, STORAGE_WRITE_DEBOUNCE_MS);
  }

  async repairAllEntries(): Promise<number> {
    const entries = await this.hydrate();
    const repaired = entries.map(repairPaymentRegisterEntry);
    const changed = repaired.filter(
      (entry, index) =>
        entry.paymentDate !== entries[index].paymentDate ||
        entry.paymentTime !== entries[index].paymentTime
    ).length;

    if (changed > 0) {
      await this.persistNow(repaired);
      logger.info('Payment register cache repair sweep', { changed, total: repaired.length });
    }

    return changed;
  }

  async upsert(
    input: Omit<
      PaymentRegisterCacheEntry,
      | 'localId'
      | 'remoteRegisterId'
      | 'remoteInvoiceId'
      | 'invoiceStatus'
      | 'syncStatus'
      | 'lastSyncError'
      | 'failureClass'
      | 'failureStage'
      | 'createdAt'
      | 'updatedAt'
    > & {
      localId?: string;
      remoteRegisterId?: string | null;
      remoteInvoiceId?: string | null;
      invoiceStatus?: PaymentRegisterCacheEntry['invoiceStatus'];
      syncStatus?: SyncStatus;
      lastSyncError?: string | null;
      failureClass?: PaymentRegisterCacheEntry['failureClass'];
      failureStage?: PaymentRegisterCacheEntry['failureStage'];
      dateSource?: PaymentDateSource;
    }
  ): Promise<PaymentRegisterCacheEntry> {
    const entries = await this.hydrate();
    const now = Date.now();
    const existing = this.keyIndex.get(input.notificationKey);

    const entry: PaymentRegisterCacheEntry = {
      localId: existing?.localId ?? input.localId ?? generateLocalId(),
      remoteRegisterId: input.remoteRegisterId ?? existing?.remoteRegisterId ?? null,
      remoteInvoiceId: input.remoteInvoiceId ?? existing?.remoteInvoiceId ?? null,
      name: input.name,
      pago: input.pago,
      mobile: input.mobile,
      ref: input.ref,
      paymentDate: normalizePaymentDate(input.paymentDate),
      paymentTime: normalizePaymentTime(input.paymentTime),
      dateSource: input.dateSource ?? existing?.dateSource ?? 'unknown',
      notificationKey: input.notificationKey,
      notificationId: input.notificationId,
      invoiceStatus: input.invoiceStatus ?? existing?.invoiceStatus ?? null,
      syncStatus: input.syncStatus ?? existing?.syncStatus ?? 'pending_sync',
      lastSyncError: input.lastSyncError ?? existing?.lastSyncError ?? null,
      failureClass: input.failureClass ?? existing?.failureClass ?? null,
      failureStage: input.failureStage ?? existing?.failureStage ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const withoutExisting = existing
      ? entries.filter((e) => e.localId !== existing.localId)
      : entries;
    const merged = this.capEntries([entry, ...withoutExisting]);
    this.cache = merged;
    this.rebuildIndex();
    this.schedulePersist(merged);
    return entry;
  }

  async updateByLocalId(
    localId: string,
    patch: Partial<
      Pick<
        PaymentRegisterCacheEntry,
        | 'remoteRegisterId'
        | 'remoteInvoiceId'
        | 'invoiceStatus'
        | 'syncStatus'
        | 'lastSyncError'
        | 'ref'
        | 'paymentDate'
        | 'paymentTime'
        | 'dateSource'
        | 'name'
        | 'pago'
        | 'mobile'
        | 'failureClass'
        | 'failureStage'
      >
    >
  ): Promise<PaymentRegisterCacheEntry | null> {
    const entries = await this.hydrate();
    const index = entries.findIndex((e) => e.localId === localId);
    if (index === -1) return null;

    const updated: PaymentRegisterCacheEntry = {
      ...entries[index],
      ...normalizeDatePatch(patch),
      updatedAt: Date.now(),
    };
    const merged = [...entries];
    merged[index] = updated;
    this.cache = merged;
    this.rebuildIndex();
    this.schedulePersist(merged);
    return updated;
  }

  async getByLocalId(localId: string): Promise<PaymentRegisterCacheEntry | null> {
    const entries = await this.hydrate();
    return entries.find((e) => e.localId === localId) ?? null;
  }

  async getByNotificationKey(key: string): Promise<PaymentRegisterCacheEntry | null> {
    await this.hydrate();
    return this.keyIndex.get(key) ?? null;
  }

  async listSlice(
    offset: number,
    limit: number = NOTIFICATION_PAGE_SIZE,
    filters: PaymentRegisterListFilters = {}
  ): Promise<PaymentRegisterListPage> {
    const entries = await this.hydrate();
    const filtered = filterPaymentRegisters(entries, filters);
    const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    const items = sorted.slice(offset, offset + limit);
    const nextOffset = offset + limit < sorted.length ? offset + limit : null;
    return { items, nextOffset, total: sorted.length };
  }

  async getFilterCounts(): Promise<PaymentRegisterFilterCounts> {
    const entries = await this.hydrate();
    return getPaymentFilterCounts(entries);
  }

  async mergeRemoteEntries(
    remoteEntries: Array<{
      id: string;
      name: string | null;
      pago: string;
      mobile: string;
      ref: string;
      paymentDate: string;
      paymentTime: string;
      invoiceId: string | null;
      invoiceStatus: 'pending' | 'paid' | null;
      notificationKey: string | null;
    }>
  ): Promise<{ updated: number; imported: number }> {
    const entries = await this.hydrate();
    const byRemoteId = new Map(
      entries.filter((e) => e.remoteRegisterId).map((e) => [e.remoteRegisterId!, e])
    );
    let updated = 0;
    let imported = 0;

    for (const remote of remoteEntries) {
      const normalizedRemoteDate = normalizePaymentDate(remote.paymentDate);
      const normalizedRemoteTime = normalizePaymentTime(remote.paymentTime);

      const existing =
        byRemoteId.get(remote.id) ??
        (remote.notificationKey ? this.keyIndex.get(remote.notificationKey) : undefined);

      if (existing) {
        const mergedDate = resolveMergedPaymentDate(existing, remote.paymentDate);
        const mergedTime = resolveMergedPaymentTime(existing, remote.paymentTime);

        tracePaymentDatePipeline({
          stage: 'merge',
          notificationKey: existing.notificationKey,
          remoteId: remote.id,
          rawDate: remote.paymentDate,
          rawTime: remote.paymentTime,
          normalizedDate: mergedDate,
          normalizedTime: mergedTime,
          policy: existing.dateSource,
        });

        const invoiceStatus = mergeInvoiceStatus(existing.invoiceStatus, remote.invoiceStatus);
        await this.updateByLocalId(existing.localId, {
          remoteRegisterId: remote.id,
          remoteInvoiceId: remote.invoiceId,
          invoiceStatus,
          name: remote.name ?? existing.name,
          pago: remote.pago,
          mobile: remote.mobile,
          ref: remote.ref || existing.ref,
          paymentDate: mergedDate,
          paymentTime: mergedTime,
          dateSource:
            existing.dateSource === 'notification_text' || existing.dateSource === 'manual'
              ? existing.dateSource
              : 'remote_api',
          syncStatus: mergeSyncStatus(existing.syncStatus, remote.invoiceStatus),
        });
        updated += 1;
        continue;
      }

      tracePaymentDatePipeline({
        stage: 'api_pull',
        remoteId: remote.id,
        rawDate: remote.paymentDate,
        rawTime: remote.paymentTime,
        normalizedDate: normalizedRemoteDate,
        normalizedTime: normalizedRemoteTime,
      });

      const notificationKey = remote.notificationKey ?? `remote-${remote.id}`;
      const syncStatus: SyncStatus =
        remote.invoiceStatus === 'paid' ? 'payment_confirmed' : 'synced';

      await this.upsert({
        remoteRegisterId: remote.id,
        remoteInvoiceId: remote.invoiceId,
        name: remote.name,
        pago: remote.pago,
        mobile: remote.mobile,
        ref: remote.ref,
        paymentDate: normalizedRemoteDate,
        paymentTime: normalizedRemoteTime,
        dateSource: 'remote_api',
        notificationKey,
        notificationId: notificationKey,
        invoiceStatus: remote.invoiceStatus,
        syncStatus,
        lastSyncError: null,
        failureClass: null,
        failureStage: null,
      });
      imported += 1;
    }

    if (imported > 0 || updated > 0) {
      await this.flush();
    }

    return { updated, imported };
  }

  async clearAll(): Promise<void> {
    await this.persistNow([]);
    this.isHydrated = true;
  }

  async flush(): Promise<void> {
    this.clearDebounce();
    if (this.cache) {
      await this.persistNow(this.cache);
    }
  }
}

export const paymentRegisterCacheRepository = new PaymentRegisterCacheRepository();
