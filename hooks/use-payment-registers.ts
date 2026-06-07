import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { NOTIFICATION_PAGE_SIZE } from '@/constants/storage-keys';
import { queryKeys } from '@/lib/query-keys';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';

export function usePaymentRegistersInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.paymentRegisters.list(),
    queryFn: ({ pageParam = 0 }) =>
      paymentRegisterService.list(pageParam, NOTIFICATION_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (localId: string) => paymentRegisterService.confirmPayment(localId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    },
  });
}

export function useAssignClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ localId, clientId }: { localId: string; clientId: string }) =>
      paymentRegisterService.assignClient(localId, clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    },
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
  return useMutation({
    mutationFn: () => paymentSyncOrchestrator.runSync('manual'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    },
  });
}
