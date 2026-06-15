import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { BACKEND_NAME } from '@/constants/backend';
import { NOTIFICATION_PAGE_SIZE } from '@/constants/storage-keys';
import { useAppFeedback } from '@/hooks/use-app-feedback';
import {
  formatManualRegisterOutcome,
  formatPullSyncOutcome,
  formatQueueRetryOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { queryKeys } from '@/lib/query-keys';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';
import type { PaymentRegisterListFilters } from '@/types/payment/payment-register-cache.types';

function invalidatePaymentQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.filterCounts() });
}

export function usePaymentRegistersInfiniteQuery(filters: PaymentRegisterListFilters = {}) {
  const { reportError } = useAppFeedback();

  return useInfiniteQuery({
    queryKey: queryKeys.paymentRegisters.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await paymentRegisterService.list(pageParam, NOTIFICATION_PAGE_SIZE, filters);
      } catch (error) {
        reportError('list_fetch', error, 'No se pudieron cargar los pagos.', 'fetch', {
          presentationContext: { anchor: 'list' },
        });
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function usePaymentFilterCountsQuery() {
  return useQuery({
    queryKey: queryKeys.paymentRegisters.filterCounts(),
    queryFn: () => paymentRegisterService.getFilterCounts(),
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (localId: string) => paymentRegisterService.confirmPayment(localId),
    onSuccess: () => {
      invalidatePaymentQueries(queryClient);
    },
  });
}

export function useManualRegisterMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: (input: {
      name: string | null;
      pago: string;
      mobile: string;
      ref: string;
      paymentDate: string;
      paymentTime: string;
    }) => paymentRegisterService.createManual(input),
    onSuccess: (result) => {
      invalidatePaymentQueries(queryClient);
      reportOutcome(formatManualRegisterOutcome(result.status));
    },
    onError: (error) => reportError('manual_register', error, 'No se pudo registrar el pago.'),
  });
}

export function usePaymentSyncStatusQuery() {
  return useQuery({
    queryKey: [...queryKeys.paymentRegisters.all, 'sync-status'],
    queryFn: () => paymentSyncQueue.getPendingCount(),
    refetchInterval: 5000,
  });
}

export function usePendingLocalSyncCountQuery() {
  return useQuery({
    queryKey: [...queryKeys.paymentRegisters.all, 'pending-local'],
    queryFn: async () => {
      const { items } = await paymentRegisterService.list(0, 500);
      return items.filter((entry) => !entry.remoteRegisterId && entry.syncStatus !== 'sync_failed')
        .length;
    },
    refetchInterval: 5000,
  });
}

export function usePullPaymentRegistersMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: () => paymentSyncOrchestrator.runSync('manual'),
    onSuccess: (result) => {
      invalidatePaymentQueries(queryClient);
      reportOutcome(formatPullSyncOutcome(result));
    },
    onError: (error) => reportError('pull_sync', error, `No se pudo sincronizar con ${BACKEND_NAME}.`, 'fetch'),
  });
}

export function useQueueRetryMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: () => paymentRegisterService.processQueue(),
    onSuccess: (result) => {
      invalidatePaymentQueries(queryClient);
      reportOutcome(formatQueueRetryOutcome(result));
    },
    onError: (error) => reportError('queue_retry', error, 'No se pudo reintentar la cola.'),
  });
}
