import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';
import type {
  ActivityLogListResponse,
  CreateActivityLogRequest,
  RemoteActivityLogEntry,
} from '@/types/feedback/activity-log-api.types';

export class ActivityLogApiService extends BaseApiClient {
  async create(input: CreateActivityLogRequest): Promise<RemoteActivityLogEntry> {
    return this.request<RemoteActivityLogEntry>('/api/v1/activity-logs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async list(page = 1, limit = 50): Promise<ActivityLogListResponse> {
    return this.request<ActivityLogListResponse>(
      `/api/v1/activity-logs?page=${page}&limit=${limit}`
    );
  }

  /** Clears activity logs for the authenticated staff user (server-side). */
  async clearMine(): Promise<void> {
    await this.request<void>('/api/v1/activity-logs/mine', { method: 'DELETE' });
  }
}

export const activityLogApiService = new ActivityLogApiService();
