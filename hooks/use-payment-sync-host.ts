import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { useApiAuthStore } from '@/stores/api-auth-store';

export function usePaymentSyncHost() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = async (reason: 'startup' | 'app_active') => {
      await paymentSyncOrchestrator.runSync(reason);
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    };

    void sync('startup');

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        useApiAuthStore.getState().expireIfNeeded();
        void sync('app_active');
      }
    });

    return () => sub.remove();
  }, [queryClient]);
}
