import { useQuery } from '@tanstack/react-query';

import { useAppFeedback } from '@/hooks/use-app-feedback';
import { queryKeys } from '@/lib/query-keys';
import { installedAppsService } from '@/lib/services/installed-apps/InstalledAppsService';

export function useInstalledAppsQuery(search: string) {
  const { reportError } = useAppFeedback();

  return useQuery({
    queryKey: [...queryKeys.installedApps.all, search] as const,
    queryFn: async () => {
      try {
        return await installedAppsService.search(search);
      } catch (error) {
        reportError(
          'list_fetch',
          error,
          'No pudimos listar las apps instaladas.',
          'fetch',
          { toast: false, log: true }
        );
        throw error;
      }
    },
  });
}
