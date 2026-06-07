import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppFeedback } from '@/hooks/use-app-feedback';
import { copy } from '@/constants/copy';
import { queryKeys } from '@/lib/query-keys';
import { gymServiceApiService } from '@/lib/api-client/services/GymServiceApiService';

export function useActiveGymServicesQuery(enabled = true) {
  const { reportError } = useAppFeedback();

  return useQuery({
    queryKey: queryKeys.services.active(),
    queryFn: async () => {
      try {
        return await gymServiceApiService.listActive();
      } catch (error) {
        reportError('list_fetch', error, copy.facturas.servicesLoadError, 'fetch', {
          presentationContext: { anchor: 'form' },
        });
        throw error;
      }
    },
    enabled,
    staleTime: 60_000,
  });
}
