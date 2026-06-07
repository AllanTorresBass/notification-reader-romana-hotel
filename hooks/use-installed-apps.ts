import { useQuery } from '@tanstack/react-query';

import { useGlobalErrorHandler } from '@/hooks/use-global-error-handler';
import { queryKeys } from '@/lib/query-keys';
import { installedAppsService } from '@/lib/services/installed-apps/InstalledAppsService';

export function useInstalledAppsQuery(search: string) {
  const { handleFetchError } = useGlobalErrorHandler();

  return useQuery({
    queryKey: [...queryKeys.installedApps.all, search] as const,
    queryFn: () => installedAppsService.search(search),
    meta: {
      onError: (error: unknown) =>
        handleFetchError(error, 'No pudimos listar las apps instaladas.'),
    },
  });
}
