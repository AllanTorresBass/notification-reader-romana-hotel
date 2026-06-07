import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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

export function usePaymentRegistersInfiniteQuery() {
  const { reportError } = useAppFeedback();

  return useInfiniteQuery({
    queryKey: queryKeys.paymentRegisters.list(),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await paymentRegisterService.list(pageParam, NOTIFICATION_PAGE_SIZE);
      } catch (error) {
        reportError('list_fetch', error, 'No se pudieron cargar los pagos.', 'fetch');
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();
  const { reportError } = useAppFeedback();

  return useMutation({
    mutationFn: (localId: string) => paymentRegisterService.confirmPayment(localId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    },
    onError: (error) => reportError('confirm_payment', error, 'No se pudo confirmar el pago.'),
  });
}

export function useAssignClientMutation() {
  const queryClient = useQueryClient();
  const { reportError } = useAppFeedback();

  return useMutation({
    mutationFn: (input: { localId: string; clientId: string; clientName?: string }) =>
      paymentRegisterService.assignClient(input.localId, input.clientId, input.clientName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      void queryClient.removeQueries({ queryKey: queryKeys.clients.all });
    },
    onError: (error) => reportError('assign_client', error, 'No se pudo asociar el cliente.'),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      reportOutcome(formatPullSyncOutcome(result));
    },
    onError: (error) => reportError('pull_sync', error, 'No se pudo sincronizar con kd-gym.', 'fetch'),
  });
}

export function useQueueRetryMutation() {
  const queryClient = useQueryClient();
  const { reportOutcome, reportError } = useAppFeedback();

  return useMutation({
    mutationFn: () => paymentRegisterService.processQueue(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      reportOutcome(formatQueueRetryOutcome(result));
    },
    onError: (error) => reportError('queue_retry', error, 'No se pudo reintentar la cola.'),
  });
}
