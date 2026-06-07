import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { useIsApiAuthenticated } from '@/hooks/use-api-auth';
import { queryKeys } from '@/lib/query-keys';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import { activityLogSyncQueue } from '@/lib/services/feedback/activity-log-sync-queue';
import { reportError } from '@/lib/feedback/report-feedback';
import {
  clearActivityLog,
  useActivityLogStore,
  type StoredActivityLogEntry,
} from '@/stores/activity-log-store';
import { remoteToActivityLogEntry } from '@/types/feedback/activity-log-api.types';

export function useActivityLogPanel() {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsApiAuthenticated();
  const localEntries = useActivityLogStore((s) => s.entries);
  const hydrated = useActivityLogStore((s) => s.hydrated);
  const expanded = useActivityLogStore((s) => s.panelExpanded);
  const setExpanded = useActivityLogStore((s) => s.setPanelExpanded);

  useEffect(() => {
    void useActivityLogStore.getState().hydrate();
  }, []);

  const remoteQuery = useQuery({
    queryKey: queryKeys.activityLogs.list(),
    queryFn: () => activityLogSyncService.fetchRemote(1, 50),
    enabled: expanded && isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!remoteQuery.data?.data) return;
    const remoteEntries: StoredActivityLogEntry[] = remoteQuery.data.data.map((remote) => {
      const mapped = remoteToActivityLogEntry(remote);
      return { ...mapped, synced: true, remoteId: mapped.remoteId };
    });
    useActivityLogStore.getState().mergeRemote(remoteEntries);
  }, [remoteQuery.data]);

  const entries = useMemo(() => localEntries, [localEntries]);

  const pendingUploads = entries.filter((entry) => !entry.synced).length;
  const sourceLabel = isAuthenticated
    ? remoteQuery.data
      ? 'Sincronizado con kd-gym'
      : pendingUploads > 0
        ? `${pendingUploads} pendiente(s) de subir`
        : 'Local + kd-gym'
    : `${entries.length} evento(s) en este dispositivo`;

  const clearAll = useCallback(async () => {
    try {
      await clearActivityLog();
      await activityLogSyncQueue.clear();
      const clearedRemote = await activityLogSyncService.clearRemote();
      if (clearedRemote) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.all });
      }
    } catch (error) {
      reportError('clear_history', error, 'No se pudo limpiar la actividad.', 'action', {
        sync: false,
      });
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await activityLogSyncService.flushPending();
    if (isAuthenticated) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.all });
    }
  }, [isAuthenticated, queryClient]);

  return {
    expanded,
    setExpanded,
    entries,
    hydrated,
    sourceLabel,
    isLoading: !hydrated || remoteQuery.isLoading,
    isRefreshing: remoteQuery.isRefetching,
    clearAll,
    refresh,
  };
}
