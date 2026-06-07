import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useNotificationListener } from '@/hooks/use-notification-listener';
import { usePaymentSyncHost } from '@/hooks/use-payment-sync-host';
import { activityLogSyncService } from '@/lib/services/feedback/ActivityLogSyncService';
import { notificationService } from '@/lib/services/notifications/NotificationService';
import { useActivityLogStore } from '@/stores/activity-log-store';
import { usePreferencesStore } from '@/stores/preferences-store';

interface AppProvidersProps {
  children: ReactNode;
}

function NotificationListenerHost() {
  useNotificationListener();
  usePaymentSyncHost();

  useEffect(() => {
    void useActivityLogStore.getState().hydrate();
    const retentionDays = usePreferencesStore.getState().retentionDays;
    void notificationService.purgeRetention(retentionDays);
    void activityLogSyncService.flushPending();
  }, []);

  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <NotificationListenerHost />
        {children}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
