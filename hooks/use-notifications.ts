import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { NOTIFICATION_PAGE_SIZE } from '@/constants/storage-keys';
import { useGlobalErrorHandler } from '@/hooks/use-global-error-handler';
import { queryKeys } from '@/lib/query-keys';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { usePreferencesStore } from '@/stores/preferences-store';
import type { NotificationListFilters } from '@/types/notification/notification.types';

export function useNotificationsInfiniteQuery(filters: NotificationListFilters) {
  const { handleFetchError } = useGlobalErrorHandler();

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return notificationService.list(offset, NOTIFICATION_PAGE_SIZE, filters);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    meta: {
      onError: (error: unknown) => handleFetchError(error),
    },
  });
}

export function useNotificationDetailQuery(id: string | null) {
  const { handleFetchError } = useGlobalErrorHandler();

  return useQuery({
    queryKey: queryKeys.notifications.detail(id ?? 'none'),
    queryFn: () => {
      if (!id) {
        return null;
      }
      return notificationService.get(id);
    },
    enabled: Boolean(id),
    meta: {
      onError: (error: unknown) => handleFetchError(error),
    },
  });
}

export function useClearHistoryMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, handleCrudError } = useGlobalErrorHandler();

  return useMutation({
    mutationFn: () => notificationService.clearHistory(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      showSuccess('Historial borrado');
    },
    onError: (error) => handleCrudError(error, 'No se pudo borrar el historial.'),
  });
}

export function usePurgeRetentionMutation() {
  const queryClient = useQueryClient();
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const { showSuccess, handleCrudError } = useGlobalErrorHandler();

  return useMutation({
    mutationFn: () => notificationService.purgeRetention(retentionDays),
    onSuccess: async (removed) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      showSuccess(
        'Retención aplicada',
        removed > 0 ? `${removed} eliminados` : 'Sin registros antiguos'
      );
    },
    onError: (error) => handleCrudError(error, 'No se pudo aplicar la retención.'),
  });
}

export function useRemovePackageHistoryMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, handleCrudError } = useGlobalErrorHandler();

  return useMutation({
    mutationFn: (packageName: string) => notificationService.removePackageHistory(packageName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      showSuccess('Historial de la app eliminado');
    },
    onError: (error) => handleCrudError(error, 'No se pudo eliminar el historial de la app.'),
  });
}
