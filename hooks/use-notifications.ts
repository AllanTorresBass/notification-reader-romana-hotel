import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { NOTIFICATION_PAGE_SIZE } from '@/constants/storage-keys';
import { useAppFeedback } from '@/hooks/use-app-feedback';
import {
  formatClearHistoryOutcome,
  formatPurgeRetentionOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { queryKeys } from '@/lib/query-keys';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { usePreferencesStore } from '@/stores/preferences-store';
import type { NotificationListFilters } from '@/types/notification/notification.types';

export function useNotificationsInfiniteQuery(filters: NotificationListFilters) {
  const { reportError } = useAppFeedback();

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      try {
        return await notificationService.list(offset, NOTIFICATION_PAGE_SIZE, filters);
      } catch (error) {
        reportError(
          'notification_list_fetch',
          error,
          'No se pudieron cargar las notificaciones.',
          'fetch'
        );
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function useNotificationDetailQuery(id: string | null) {
  const { reportError } = useAppFeedback();

  return useQuery({
    queryKey: queryKeys.notifications.detail(id ?? 'none'),
    queryFn: async () => {
      if (!id) {
        return null;
      }
      try {
        return await notificationService.get(id);
      } catch (error) {
        reportError(
          'notification_list_fetch',
          error,
          'No se pudo cargar la notificación.',
          'fetch'
        );
        throw error;
      }
    },
    enabled: Boolean(id),
  });
}

export function useClearHistoryMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: () => notificationService.clearHistory(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      reportOutcome(formatClearHistoryOutcome());
    },
    onError: (error) =>
      reportError('clear_history', error, 'No se pudo borrar el historial.'),
  });
}

export function usePurgeRetentionMutation() {
  const queryClient = useQueryClient();
  const retentionDays = usePreferencesStore((s) => s.retentionDays);
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: () => notificationService.purgeRetention(retentionDays),
    onSuccess: async (removed) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      reportOutcome(formatPurgeRetentionOutcome(removed));
    },
    onError: (error) =>
      reportError('purge_retention', error, 'No se pudo aplicar la retención.'),
  });
}

export function useRemovePackageHistoryMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: (packageName: string) => notificationService.removePackageHistory(packageName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      reportOutcome({
        kind: 'clear_history',
        status: 'completed',
        title: 'Historial de app eliminado',
        message: 'Las notificaciones de esa app fueron borradas localmente.',
      });
    },
    onError: (error) =>
      reportError('clear_history', error, 'No se pudo eliminar el historial de la app.'),
  });
}
