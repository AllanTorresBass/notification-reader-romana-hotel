import { useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { Banner } from '@/components/ui/Banner';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useGlobalErrorHandler } from '@/hooks/use-global-error-handler';
import { useApiAuthStatus, useIsApiAuthenticated, useLastSyncError } from '@/hooks/use-api-auth';
import {
  useAssignClientMutation,
  useConfirmPaymentMutation,
  usePaymentRegistersInfiniteQuery,
  usePendingLocalSyncCountQuery,
} from '@/hooks/use-payment-registers';
import { useNotificationShadeSync } from '@/hooks/use-notification-shade-sync';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { queryKeys } from '@/lib/query-keys';
import { uxLogger } from '@/lib/logger';
import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

export default function PagosScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const queryClient = useQueryClient();
  const { handleCrudError, showSuccess } = useGlobalErrorHandler();
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
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const detailRef = useRef<BottomSheet>(null);
  const assignRef = useRef<BottomSheet>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    usePaymentRegistersInfiniteQuery();
  const confirmPayment = useConfirmPaymentMutation();
  const assignClient = useAssignClientMutation();
  const { data: pendingLocalSync = 0 } = usePendingLocalSyncCountQuery();
  const { syncFromShade } = useNotificationShadeSync();

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const banner = useMemo(() => {
    if (authStatus === 'expired' || lastSyncError) {
      return {
        message: lastSyncError ?? copy.pagos.sessionExpired,
        variant: 'warning' as const,
        actionLabel: copy.pagos.goToSettings,
        onAction: () => {
          uxLogger.event('auth_redirect', { source: 'pagos_banner' });
          router.push('/(tabs)/settings');
        },
      };
    }
    if (!isAuthenticated) {
      return {
        message: copy.pagos.connectPrompt,
        variant: 'info' as const,
        actionLabel: copy.pagos.goToSettings,
        onAction: () => router.push('/(tabs)/settings'),
      };
    }
    if (pendingLocalSync > 0) {
      return {
        message: copy.pagos.pendingSync(pendingLocalSync),
        variant: 'info' as const,
      };
    }
    return null;
  }, [authStatus, isAuthenticated, lastSyncError, pendingLocalSync, router]);

  const openDetail = useCallback((entry: PaymentRegisterCacheEntry) => {
    setSelected(entry);
    detailRef.current?.expand();
  }, []);

  const refresh = useCallback(async () => {
    await syncFromShade();
    await paymentSyncOrchestrator.runSync(isAuthenticated ? 'manual' : 'notification');
    await refetch();
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.lists() });
  }, [isAuthenticated, queryClient, refetch, syncFromShade]);

  const handleConfirmPayment = useCallback(() => {
    if (!selected) return;
    confirmPayment.mutate(selected.localId, {
      onSuccess: (updated) => {
        if (updated) setSelected(updated);
        showSuccess('Pago confirmado');
      },
      onError: (error) => handleCrudError(error, 'No se pudo confirmar el pago.'),
    });
  }, [selected, confirmPayment, handleCrudError, showSuccess]);

  const handleAssignClient = useCallback(() => {
    detailRef.current?.close();
    assignRef.current?.expand();
  }, []);

  const handleAssign = useCallback(
    (clientId: string) => {
      if (!selected) return;
      assignClient.mutate(
        { localId: selected.localId, clientId },
        {
          onSuccess: (updated) => {
            assignRef.current?.close();
            if (updated) setSelected(updated);
            showSuccess('Cliente asociado');
          },
          onError: (error) => handleCrudError(error, 'No se pudo asociar el cliente.'),
        }
      );
    },
    [selected, assignClient, handleCrudError, showSuccess]
  );

  const submitManual = useCallback(async () => {
    setManualSubmitting(true);
    try {
      const pago = normalizePagoAmount(manualPago);
      await paymentRegisterService.createManual({
        name: manualName.trim() || null,
        pago,
        mobile: manualMobile.trim(),
        ref: manualRef.trim(),
        paymentDate: manualDate.trim(),
        paymentTime: manualTime.trim(),
      });
      setShowManual(false);
      uxLogger.event('manual_register_opened', { success: true });
      showSuccess('Pago registrado');
      await refetch();
    } catch (error) {
      handleCrudError(error, 'No se pudo registrar el pago.');
    } finally {
      setManualSubmitting(false);
    }
  }, [
    manualName,
    manualPago,
    manualMobile,
    manualRef,
    manualDate,
    manualTime,
    refetch,
    handleCrudError,
    showSuccess,
  ]);

  if (isLoading) {
    return (
      <AppScreen title={copy.pagos.title} subtitle={copy.pagos.loading} scroll={false}>
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title={copy.pagos.title} subtitle={copy.pagos.subtitle} scroll={false}>
      {banner ? (
        <Banner
          message={banner.message}
          variant={banner.variant}
          actionLabel={banner.actionLabel}
          onAction={banner.onAction}
        />
      ) : null}

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
          onSubmit={() => {
            uxLogger.event('manual_register_opened');
            void submitManual();
          }}
          isSubmitting={manualSubmitting}
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
        onConfirmPayment={handleConfirmPayment}
        onAssignClient={handleAssignClient}
        isConfirming={confirmPayment.isPending}
      />

      <AssignClientSheet
        ref={assignRef}
        onAssign={handleAssign}
        isAssigning={assignClient.isPending}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: spacing.md, padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  footer: { paddingVertical: spacing.md },
});
