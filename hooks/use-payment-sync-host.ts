import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { formatBackgroundSyncOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { queryKeys } from '@/lib/query-keys';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { useApiAuthStore } from '@/stores/api-auth-store';

export function usePaymentSyncHost() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = async (reason: 'startup' | 'app_active') => {
      const result = await paymentSyncOrchestrator.runSync(reason);
      const outcome = formatBackgroundSyncOutcome(result);
      if (outcome) {
        reportOutcome(outcome, {
          toast: outcome.status === 'failed' || (outcome.meta?.created as number) > 0,
          log: true,
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
      void activityLogSyncService.flushPending();
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
