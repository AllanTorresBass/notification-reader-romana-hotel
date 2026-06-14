import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';

export interface RemoteClient {
  id: string;
  fullName: string;
  identityCard: string;
  phone: string | null;
}

export interface ClientListResponse {
  data: RemoteClient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ClientApiService extends BaseApiClient {
  async search(search: string, page = 1, limit = 20): Promise<ClientListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) {
      params.set('search', search.trim());
    }
    return this.request<ClientListResponse>(`/api/v1/clients?${params.toString()}`);
  }

  async create(input: {
    fullName: string;
    identityCard: string;
    phone?: string | null;
  }): Promise<RemoteClient> {
    return this.request<RemoteClient>('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export const clientApiService = new ClientApiService();
