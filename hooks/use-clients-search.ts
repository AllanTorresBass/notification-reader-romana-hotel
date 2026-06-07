import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { clientApiService } from '@/lib/api-client/clients/ClientApiService';

export function useClientSearchQuery(search: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.clients.search(search),
    queryFn: () => clientApiService.search(search, 1, 20),
    enabled: enabled && search.trim().length >= 2,
  });
}
