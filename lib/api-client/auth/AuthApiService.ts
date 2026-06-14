import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';
import type { ApiAuthUser } from '@/stores/api-auth-store';

export interface MobileLoginResponse {
  accessToken: string;
  expiresAt: string;
  user: ApiAuthUser;
}

export class AuthApiService extends BaseApiClient {
  async login(email: string, password: string): Promise<MobileLoginResponse> {
    return this.request<MobileLoginResponse>('/api/v1/auth/mobile/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  }

  async pingMe(): Promise<MobileLoginResponse['user']> {
    return this.request<MobileLoginResponse['user']>('/api/v1/auth/mobile/me');
  }
}

export const authApiService = new AuthApiService();
