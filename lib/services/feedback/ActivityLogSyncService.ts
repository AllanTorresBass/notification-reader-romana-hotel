import { activityLogApiService } from '@/lib/api-client/activity-log/ActivityLogApiService';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { logger } from '@/lib/logger';
import { localEntryToCreateRequest } from '@/types/feedback/activity-log-api.types';
import { useActivityLogStore, type StoredActivityLogEntry } from '@/stores/activity-log-store';
import { useApiAuthStore } from '@/stores/api-auth-store';
import { activityLogSyncQueue } from '@/lib/services/feedback/activity-log-sync-queue';

let flushInFlight = false;

function isActivityLogApiUnavailable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status === 404 || error.status === 501 || error.status === 405;
}

export class ActivityLogSyncService {
  async enqueueUpload(entry: StoredActivityLogEntry): Promise<void> {
    await activityLogSyncQueue.enqueue(entry.id);
    void this.flushPending();
  }

  async flushPending(): Promise<{ uploaded: number; failed: number }> {
    if (flushInFlight) return { uploaded: 0, failed: 0 };
    if (!useApiAuthStore.getState().isAuthenticated()) {
      return { uploaded: 0, failed: 0 };
    }

    flushInFlight = true;
    let uploaded = 0;
    let failed = 0;

    try {
      const pendingIds = await activityLogSyncQueue.listPending();
      const entriesById = new Map(
        useActivityLogStore.getState().entries.map((entry) => [entry.id, entry])
      );

      for (const clientEventId of pendingIds) {
        const entry = entriesById.get(clientEventId);
        if (!entry) {
          await activityLogSyncQueue.dequeue(clientEventId);
          continue;
        }

        try {
          const remote = await activityLogApiService.create(localEntryToCreateRequest(entry));
          useActivityLogStore.getState().markSynced(clientEventId, remote.id);
          await activityLogSyncQueue.dequeue(clientEventId);
          uploaded += 1;
        } catch (error) {
          if (isActivityLogApiUnavailable(error)) {
            logger.info('Activity log API not available on server — keeping local only');
            await activityLogSyncQueue.clear();
            break;
          }
          failed += 1;
          logger.warn('Activity log upload failed', {
            clientEventId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      flushInFlight = false;
    }

    return { uploaded, failed };
  }

  async fetchRemote(page = 1, limit = 50) {
    if (!useApiAuthStore.getState().isAuthenticated()) {
      return null;
    }
    try {
      return await activityLogApiService.list(page, limit);
    } catch (error) {
      if (isActivityLogApiUnavailable(error)) {
        return null;
      }
      throw error;
    }
  }

  async clearRemote(): Promise<boolean> {
    if (!useApiAuthStore.getState().isAuthenticated()) {
      return false;
    }
    try {
      await activityLogApiService.clearMine();
      return true;
    } catch (error) {
      if (isActivityLogApiUnavailable(error)) {
        return false;
      }
      throw error;
    }
  }
}

export const activityLogSyncService = new ActivityLogSyncService();
