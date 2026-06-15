import {
  MAX_PAYMENT_REGISTER_ENTRIES,
  NOTIFICATION_PAGE_SIZE,
  STORAGE_KEYS,
  STORAGE_VERSION,
  STORAGE_WRITE_DEBOUNCE_MS,
} from '@/constants/storage-keys';
import { BaseStorageRepository } from '@/lib/services/base/base-storage-repository';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';
import { logger } from '@/lib/logger';
import { paymentRegisterStoreEnvelopeSchema } from '@/types/payment/payment-register-cache.schemas';
import { mergeInvoiceStatus, mergeSyncStatus } from '@/lib/utils/merge-payment-register-state';
import { filterPaymentRegisters, getPaymentFilterCounts } from '@/lib/utils/filter-payment-registers';
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

export class PaymentRegisterCacheRepository extends BaseStorageRepository {
  private cache: PaymentRegisterCacheEntry[] | null = null;
  private keyIndex = new Map<string, PaymentRegisterCacheEntry>();
  private isHydrated = false;

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

    this.cache = parsed.data.entries;
    this.rebuildIndex();
    this.isHydrated = true;
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
    const envelope = { version: STORAGE_VERSION as 1, entries };
    await secureStorageClient.setJson(STORAGE_KEYS.paymentRegisters, envelope);
    this.cache = entries;
    this.rebuildIndex();
  }

  private schedulePersist(entries: PaymentRegisterCacheEntry[]): void {
    this.scheduleDebouncedWrite(async () => {
      await this.persistNow(entries);
    }, STORAGE_WRITE_DEBOUNCE_MS);
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
      paymentDate: input.paymentDate,
      paymentTime: input.paymentTime,
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
      ...patch,
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
      invoiceId: string | null;
      invoiceStatus: 'pending' | 'paid' | null;
      notificationKey: string | null;
    }>
  ): Promise<void> {
    const entries = await this.hydrate();
    const byRemoteId = new Map(entries.filter((e) => e.remoteRegisterId).map((e) => [e.remoteRegisterId!, e]));

    for (const remote of remoteEntries) {
      const existing =
        byRemoteId.get(remote.id) ??
        (remote.notificationKey ? this.keyIndex.get(remote.notificationKey) : undefined);

      if (existing) {
        const invoiceStatus = mergeInvoiceStatus(existing.invoiceStatus, remote.invoiceStatus);
        await this.updateByLocalId(existing.localId, {
          remoteRegisterId: remote.id,
          remoteInvoiceId: remote.invoiceId,
          invoiceStatus,
          name: remote.name ?? existing.name,
          pago: remote.pago,
          mobile: remote.mobile,
          syncStatus: mergeSyncStatus(existing.syncStatus, invoiceStatus),
        });
      }
    }
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
