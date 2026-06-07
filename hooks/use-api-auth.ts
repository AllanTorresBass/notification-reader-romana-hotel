import { useMutation } from '@tanstack/react-query';

import {
  formatLoginOutcome,
  formatLogoutOutcome,
  formatTestConnectionOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportError, reportOutcome } from '@/lib/feedback/report-feedback';
import { selectAuthStatus, selectIsAuthenticated } from '@/lib/auth/auth-selectors';
import { authApiService } from '@/lib/api-client/auth/AuthApiService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { useApiAuthStore } from '@/stores/api-auth-store';
import type { ReportOutcomeOptions } from '@/lib/feedback/report-feedback';

export function useApiLoginMutation() {
  const setAuth = useApiAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authApiService.login(email, password);
      setAuth(result.accessToken, result.expiresAt, result.user);
      await authApiService.pingMe();
      await paymentSyncOrchestrator.runSync('login');
      return result;
    },
  });
}

export function reportLoginSuccess(options?: ReportOutcomeOptions): void {
  reportOutcome(formatLoginOutcome(true), options);
}

export function reportLoginError(
  error: unknown,
  options?: ReportOutcomeOptions
): void {
  reportError('login', error, 'Verifica URL, email staff y contraseña.', 'action', options);
}

export function useApiLogout() {
  const clearAuth = useApiAuthStore((s) => s.clearAuth);
  return () => {
    clearAuth();
    reportOutcome(formatLogoutOutcome());
  };
}

export function useIsApiAuthenticated() {
  return useApiAuthStore((s) => selectIsAuthenticated(s));
}

export function useApiAuthStatus() {
  return useApiAuthStore((s) => selectAuthStatus(s));
}

export function useApiUser() {
  return useApiAuthStore((s) => s.user);
}

export function useLastSyncError() {
  return useApiAuthStore((s) => s.lastSyncError);
}

export function useTestConnectionMutation() {
  return useMutation({
    mutationFn: async () => {
      if (!useApiAuthStore.getState().isAuthenticated()) {
        throw new Error('Inicia sesión staff para probar la conexión.');
      }
      await authApiService.pingMe();
      return paymentSyncOrchestrator.runSync('manual');
    },
    onSuccess: (result) => reportOutcome(formatTestConnectionOutcome(result)),
    onError: (error) =>
      reportError('test_connection', error, 'No se pudo conectar con kd-gym.', 'fetch'),
  });
}
