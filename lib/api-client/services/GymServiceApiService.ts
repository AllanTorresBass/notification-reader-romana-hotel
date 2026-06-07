import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';
import type { GymService, PaginatedServicesResponse } from '@/types/service/service.types';

export class GymServiceApiService extends BaseApiClient {
  async listActive(limit = 100): Promise<GymService[]> {
    const params = new URLSearchParams({
      isActive: 'true',
      limit: String(limit),
    });
    const response = await this.request<PaginatedServicesResponse>(
      `/api/v1/services?${params.toString()}`
    );
    return response.data;
  }
}

export const gymServiceApiService = new GymServiceApiService();
