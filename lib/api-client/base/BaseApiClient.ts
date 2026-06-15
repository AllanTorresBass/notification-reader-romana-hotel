import { useApiAuthStore } from '@/stores/api-auth-store';
import { useApiConfigStore } from '@/stores/api-config-store';
import { authEvents, classifyApiError, type SyncErrorCode } from '@/lib/auth/auth-events';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: SyncErrorCode = classifyApiError(status)
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BaseApiClient {
  protected getBaseUrl(): string {
    const baseUrl = useApiConfigStore.getState().baseUrl.trim().replace(/\/$/, '');
    if (!baseUrl) {
      throw new ApiError('API base URL not configured', 0);
    }
    return baseUrl;
  }

  protected getAuthHeaders(): Record<string, string> {
    const token = useApiAuthStore.getState().accessToken;
    if (!token) {
      throw new ApiError('Not authenticated', 401);
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  protected async request<T>(
    path: string,
    options: RequestInit & { auth?: boolean } = {}
  ): Promise<T> {
    const { auth = true, ...init } = options;
    const url = `${this.getBaseUrl()}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string>),
    };

    if (auth) {
      Object.assign(headers, this.getAuthHeaders());
    }

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiError(message, 0, 'network');
    }

    if (response.redirected && response.url.includes('/sign-in')) {
      throw new ApiError(
        'El servidor redirigió al portal web. Verifica la URL de La Romana en Ajustes.',
        401,
        'auth_unauthorized'
      );
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text };
      }
    }

    if (!response.ok) {
      const message =
        typeof body === 'object' && body && 'error' in body
          ? String((body as { error: string }).error)
          : `Request failed (${response.status})`;

      if (auth && response.status === 401) {
        useApiAuthStore.getState().clearAuth();
        useApiAuthStore.getState().setLastSyncError(message);
        authEvents.emitUnauthorized();
      }

      throw new ApiError(message, response.status);
    }

    return body as T;
  }
}

export const baseApiClient = new BaseApiClient();
