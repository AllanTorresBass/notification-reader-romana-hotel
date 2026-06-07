import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants/storage-keys';
import { logger } from '@/lib/logger';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';

const MAX_PENDING = 200;

interface ActivityLogSyncQueueEnvelope {
  version: 1;
  pendingClientEventIds: string[];
}

export class ActivityLogSyncQueue {
  private pending: string[] | null = null;

  private async hydrate(): Promise<string[]> {
    if (this.pending) return this.pending;

    const envelope = await secureStorageClient.getJson<ActivityLogSyncQueueEnvelope>(
      STORAGE_KEYS.activityLogSyncQueue
    );
    if (!envelope || envelope.version !== 1) {
      this.pending = [];
      return this.pending;
    }

    this.pending = envelope.pendingClientEventIds;
    return this.pending;
  }

  private async persist(ids: string[]): Promise<void> {
    this.pending = ids.slice(0, MAX_PENDING);
    await secureStorageClient.setJson(STORAGE_KEYS.activityLogSyncQueue, {
      version: STORAGE_VERSION as 1,
      pendingClientEventIds: this.pending,
    });
  }

  async enqueue(clientEventId: string): Promise<void> {
    const ids = await this.hydrate();
    if (ids.includes(clientEventId)) return;
    await this.persist([clientEventId, ...ids]);
  }

  async dequeue(clientEventId: string): Promise<void> {
    const ids = await this.hydrate();
    await this.persist(ids.filter((id) => id !== clientEventId));
  }

  async listPending(): Promise<string[]> {
    return this.hydrate();
  }

  async clear(): Promise<void> {
    await this.persist([]);
  }
}

export const activityLogSyncQueue = new ActivityLogSyncQueue();
