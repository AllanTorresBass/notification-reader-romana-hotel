import { useQuery } from '@tanstack/react-query';

import { useAppFeedback } from '@/hooks/use-app-feedback';
import { copy } from '@/constants/copy';
import { queryKeys } from '@/lib/query-keys';
import { clientApiService } from '@/lib/api-client/clients/ClientApiService';

export function useClientSearchQuery(search: string, enabled: boolean) {
  const { reportError } = useAppFeedback();

  return useQuery({
    queryKey: queryKeys.clients.search(search),
    queryFn: async () => {
      try {
        return await clientApiService.search(search, 1, 20);
      } catch (error) {
        reportError('client_search', error, copy.clients.searchError, 'fetch', {
          presentationContext: { anchor: 'form' },
        });
        throw error;
      }
    },
    enabled: enabled && search.trim().length >= 2,
  });
}
