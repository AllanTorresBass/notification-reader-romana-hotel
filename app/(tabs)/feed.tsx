import { useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AssignClientSheet } from '@/components/payments/AssignClientSheet';
import { ManualRegisterForm } from '@/components/payments/ManualRegisterForm';
import { PaymentDetailSheet } from '@/components/payments/PaymentDetailSheet';
import { PaymentRegisterCard } from '@/components/payments/PaymentRegisterCard';
import { AppScreen } from '@/components/shared/AppScreen';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { BannerStack, type BannerItem } from '@/components/ui/Banner';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useApiAuthStatus, useIsApiAuthenticated, useLastSyncError } from '@/hooks/use-api-auth';
import {
  useAssignClientMutation,
  useConfirmPaymentMutation,
  useManualRegisterMutation,
  usePaymentRegistersInfiniteQuery,
  usePendingLocalSyncCountQuery,
  useQueueRetryMutation,
} from '@/hooks/use-payment-registers';
import { useNotificationShadeSync } from '@/hooks/use-notification-shade-sync';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { queryKeys } from '@/lib/query-keys';
import { uxLogger } from '@/lib/logger';
import {
  formatAssignClientOutcome,
  formatConfirmPaymentOutcome,
  formatErrorOutcome,
  formatPullSyncOutcome,
  formatShadeSyncOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportOutcome, reportError } from '@/lib/feedback/report-feedback';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function outcomeBannerVariant(status: OperationOutcome['status']): BannerItem['variant'] {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'queued' || status === 'partial') return 'warning';
  return 'info';
}

export default function PagosScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const queryClient = useQueryClient();
  const isAuthenticated = useIsApiAuthenticated();
  const authStatus = useApiAuthStatus();
  const lastSyncError = useLastSyncError();
  const [selected, setSelected] = useState<PaymentRegisterCacheEntry | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPago, setManualPago] = useState('');
  const [manualMobile, setManualMobile] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [refreshBanner, setRefreshBanner] = useState<BannerItem | null>(null);
  const [actionBanner, setActionBanner] = useState<BannerItem | null>(null);
  const [detailFeedback, setDetailFeedback] = useState<OperationOutcome | null>(null);
  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);
  const [assignSheetResetToken, setAssignSheetResetToken] = useState(0);

  const detailRef = useRef<BottomSheet>(null);
  const assignRef = useRef<BottomSheet>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    usePaymentRegistersInfiniteQuery();
  const confirmPayment = useConfirmPaymentMutation();
  const assignClient = useAssignClientMutation();
  const manualRegister = useManualRegisterMutation();
  const queueRetry = useQueueRetryMutation();
  const { data: pendingLocalSync = 0 } = usePendingLocalSyncCountQuery();
  const { syncFromShade } = useNotificationShadeSync();

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  useEffect(() => {
    if (!refreshBanner) return;
    const timer = setTimeout(() => setRefreshBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [refreshBanner]);

  useEffect(() => {
    if (!actionBanner) return;
    const timer = setTimeout(() => setActionBanner(null), 6000);
    return () => clearTimeout(timer);
  }, [actionBanner]);

  useEffect(() => {
    if (!selected) return;
    const fresh = entries.find((entry) => entry.localId === selected.localId);
    if (fresh && fresh.updatedAt !== selected.updatedAt) {
      setSelected(fresh);
    }
  }, [entries, selected]);

  const showActionBanner = useCallback((outcome: OperationOutcome) => {
    setActionBanner({
      id: `${outcome.kind}-${Date.now()}`,
      title: outcome.title,
      message: outcome.message,
      variant: outcomeBannerVariant(outcome.status),
      dismissible: true,
      onDismiss: () => setActionBanner(null),
    });
  }, []);

  const banners = useMemo(() => {
    const items: BannerItem[] = [];

    if (refreshBanner) {
      items.push(refreshBanner);
    }

    if (actionBanner) {
      items.push(actionBanner);
    }

    if (authStatus === 'expired' || lastSyncError) {
      items.push({
        id: 'auth-warning',
        message: lastSyncError ?? copy.pagos.sessionExpired,
        variant: 'warning',
        actionLabel: copy.pagos.goToSettings,
        onAction: () => {
          uxLogger.event('auth_redirect', { source: 'pagos_banner' });
          router.push('/(tabs)/settings');
        },
      });
    } else if (!isAuthenticated) {
      items.push({
        id: 'connect-info',
        message: copy.pagos.connectPrompt,
        variant: 'info',
        actionLabel: copy.pagos.goToSettings,
        onAction: () => router.push('/(tabs)/settings'),
      });
    } else if (pendingLocalSync > 0) {
      items.push({
        id: 'pending-sync',
        message: copy.pagos.pendingSync(pendingLocalSync),
        variant: 'info',
        actionLabel: 'Reintentar',
        onAction: () => queueRetry.mutate(),
      });
    }

    return items;
  }, [
    authStatus,
    isAuthenticated,
    lastSyncError,
    pendingLocalSync,
    refreshBanner,
    actionBanner,
    router,
    queueRetry,
  ]);

  const openDetail = useCallback((entry: PaymentRegisterCacheEntry) => {
    setDetailFeedback(null);
    setAssigningClientId(null);
    setSelected(entry);
    detailRef.current?.expand();
  }, []);

  const resetAssignSheetDraft = useCallback(() => {
    setAssignSheetResetToken((token) => token + 1);
    setAssigningClientId(null);
  }, []);

  const resetPaymentWorkflow = useCallback(() => {
    assignRef.current?.close();
    detailRef.current?.close();
    setSelected(null);
    setDetailFeedback(null);
    resetAssignSheetDraft();
    void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
  }, [queryClient, resetAssignSheetDraft]);

  const refresh = useCallback(async () => {
    try {
      const shade = await syncFromShade();
      const shadeOutcome = formatShadeSyncOutcome(shade);
      reportOutcome(shadeOutcome, { toast: false, log: true });

      const syncResult = await paymentSyncOrchestrator.runSync(
        isAuthenticated ? 'manual' : 'notification'
      );
      const syncOutcome = formatPullSyncOutcome(syncResult);
      reportOutcome(syncOutcome);

      if (syncOutcome.status === 'completed' || syncOutcome.status === 'skipped') {
        setRefreshBanner({
          id: 'refresh-success',
          message: syncOutcome.message,
          variant: syncOutcome.status === 'completed' ? 'success' : 'info',
          dismissible: true,
          onDismiss: () => setRefreshBanner(null),
        });
      }

      await refetch();
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
    } catch (error) {
      reportError('pull_sync', error, 'No se pudo actualizar la lista.');
    }
  }, [isAuthenticated, queryClient, refetch, syncFromShade]);

  const handleConfirmPayment = useCallback(() => {
    if (!selected) return;
    confirmPayment.mutate(selected.localId, {
      onSuccess: (result) => {
        const outcome = formatConfirmPaymentOutcome(result);
        setDetailFeedback(outcome);
        reportOutcome(outcome, { toast: false, log: true });
        if (result.entry) setSelected(result.entry);
        if (result.status === 'completed') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      onError: (error) => {
        const outcome = formatErrorOutcome(
          'confirm_payment',
          error,
          'No se pudo confirmar el pago.'
        );
        setDetailFeedback(outcome);
      },
    });
  }, [selected, confirmPayment]);

  const handleAssignClient = useCallback(() => {
    detailRef.current?.close();
    assignRef.current?.expand();
  }, []);

  const handleAssign = useCallback(
    (clientId: string, clientName: string) => {
      if (!selected) return;
      setAssigningClientId(clientId);
      assignClient.mutate(
        { localId: selected.localId, clientId, clientName },
        {
          onSuccess: (result) => {
            const outcome = formatAssignClientOutcome(result, clientName);
            reportOutcome(outcome, { toast: false, log: true });
            showActionBanner(outcome);
            resetAssignSheetDraft();

            if (result.status === 'completed' || result.status === 'already_done') {
              if (result.status === 'completed') {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              resetPaymentWorkflow();
              return;
            }

            assignRef.current?.close();
            if (result.entry) {
              setSelected(result.entry);
              detailRef.current?.expand();
            }
          },
          onError: () => setAssigningClientId(null),
        }
      );
    },
    [selected, assignClient, showActionBanner, resetAssignSheetDraft, resetPaymentWorkflow]
  );

  const submitManual = useCallback(() => {
    try {
      const pago = normalizePagoAmount(manualPago);
      manualRegister.mutate(
        {
          name: manualName.trim() || null,
          pago,
          mobile: manualMobile.trim(),
          ref: manualRef.trim(),
          paymentDate: manualDate.trim(),
          paymentTime: manualTime.trim(),
        },
        {
          onSuccess: () => {
            setShowManual(false);
            void refetch();
          },
        }
      );
    } catch (error) {
      reportError('manual_register', error, 'Monto inválido. Ejemplo: 15000,00');
    }
  }, [manualName, manualPago, manualMobile, manualRef, manualDate, manualTime, manualRegister, refetch]);

  if (isLoading) {
    return (
      <AppScreen title={copy.pagos.title} subtitle={copy.pagos.loading} scroll={false} brandLogo>
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title={copy.pagos.title} subtitle={copy.pagos.subtitle} scroll={false} brandLogo>
      <BannerStack items={banners} />

      {showManual ? (
        <ManualRegisterForm
          name={manualName}
          pago={manualPago}
          mobile={manualMobile}
          ref={manualRef}
          paymentDate={manualDate}
          paymentTime={manualTime}
          onChangeName={setManualName}
          onChangePago={setManualPago}
          onChangeMobile={setManualMobile}
          onChangeRef={setManualRef}
          onChangePaymentDate={setManualDate}
          onChangePaymentTime={setManualTime}
          onSubmit={submitManual}
          isSubmitting={manualRegister.isPending}
        />
      ) : null}

      {entries.length === 0 && !showManual ? (
        <EmptyState
          title={copy.pagos.emptyTitle}
          description={copy.pagos.emptyDescription}
          action={
            <PrimaryButton
              label={copy.pagos.manualRegister}
              onPress={() => setShowManual(true)}
            />
          }
        />
      ) : (
        <FlashList
          data={entries}
          keyExtractor={(item) => item.localId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          renderItem={({ item }) => (
            <PaymentRegisterCard entry={item} onPress={openDetail} />
          )}
          ListFooterComponent={
            hasNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
        />
      )}

      <PaymentDetailSheet
        ref={detailRef}
        entry={selected}
        actionFeedback={detailFeedback}
        onConfirmPayment={handleConfirmPayment}
        onAssignClient={handleAssignClient}
        isConfirming={confirmPayment.isPending}
      />

      <AssignClientSheet
        ref={assignRef}
        onAssign={handleAssign}
        isAssigning={assignClient.isPending}
        assigningClientId={assigningClientId}
        resetToken={assignSheetResetToken}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: spacing.md, padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  footer: { paddingVertical: spacing.md },
});
