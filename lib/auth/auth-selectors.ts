import type { ApiAuthState } from '@/stores/api-auth-store';

export function selectIsAuthenticated(state: ApiAuthState): boolean {
  if (!state.accessToken || !state.expiresAt) return false;
  return new Date(state.expiresAt).getTime() > Date.now();
}

export function selectAuthStatus(
  state: ApiAuthState
): 'disconnected' | 'connected' | 'expired' {
  if (!state.accessToken || !state.expiresAt) return 'disconnected';
  if (new Date(state.expiresAt).getTime() <= Date.now()) return 'expired';
  return 'connected';
}

export function selectTokenExpiresInMs(state: ApiAuthState): number | null {
  if (!state.expiresAt) return null;
  return new Date(state.expiresAt).getTime() - Date.now();
}
