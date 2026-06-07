import { useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AssignClientSheet } from '@/components/payments/AssignClientSheet';
import { ManualRegisterForm } from '@/components/payments/ManualRegisterForm';
import { PaymentDetailSheet } from '@/components/payments/PaymentDetailSheet';
import { PaymentFilterBar } from '@/components/payments/PaymentFilterBar';
import { PaymentRegisterCard } from '@/components/payments/PaymentRegisterCard';
import { AppScreen } from '@/components/shared/AppScreen';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { BannerStack, type BannerItem } from '@/components/ui/Banner';
import { ThemedText } from '@/components/ui/ThemedText';
import { copy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import { useApiAuthStatus, useIsApiAuthenticated, useLastSyncError } from '@/hooks/use-api-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useAssignClientMutation,
  useConfirmPaymentMutation,
  useManualRegisterMutation,
  usePaymentFilterCountsQuery,
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
import { outcomeToBannerItem } from '@/lib/feedback/outcome-to-banner';
import { reportOutcome, reportError, reportOutcomeWithPolicy } from '@/lib/feedback/report-feedback';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';
import { getPaymentActionHint } from '@/lib/utils/filter-payment-registers';
import {
  flattenPaymentSections,
  groupPaymentRegistersByDate,
  type PaymentListRow,
} from '@/lib/utils/group-payment-registers';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';
import type {
  PaymentRegisterCacheEntry,
  PaymentRegisterListFilters,
  PaymentStatusFilter,
} from '@/types/payment/payment-register-cache.types';

const DEFAULT_STATUS_FILTER: PaymentStatusFilter = 'needs_action';

function SectionHeader({ title }: { title: string }) {
  const { colors } = useThemeColors();
  return (
    <ThemedText
      variant="label"
      muted
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    >
      {title}
    </ThemedText>
  );
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
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>(DEFAULT_STATUS_FILTER);
  const [searchInput, setSearchInput] = useState('');
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
  const cardOpenTimeRef = useRef<number | null>(null);
  const prevStatusFilterRef = useRef(statusFilter);
  const prevDebouncedSearchRef = useRef('');

  const detailRef = useRef<BottomSheet>(null);
  const assignRef = useRef<BottomSheet>(null);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const filters = useMemo<PaymentRegisterListFilters>(
    () => ({
      status: statusFilter,
      search: debouncedSearch.trim() || undefined,
    }),
    [statusFilter, debouncedSearch]
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setStatusFilter(DEFAULT_STATUS_FILTER);
        setSearchInput('');
      };
    }, [])
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    usePaymentRegistersInfiniteQuery(filters);
  const { data: filterCounts } = usePaymentFilterCountsQuery();
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

  const filteredTotal = data?.pages[0]?.total ?? 0;
  const cacheEmpty = (filterCounts?.all ?? 0) === 0;
  const hasActiveFilter =
    statusFilter !== DEFAULT_STATUS_FILTER || searchInput.trim().length > 0;

  const listRows = useMemo((): PaymentListRow[] => {
    const sections = groupPaymentRegistersByDate(entries);
    return flattenPaymentSections(sections);
  }, [entries]);

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

  useEffect(() => {
    if (prevStatusFilterRef.current === statusFilter) return;
    uxLogger.event('payment_filter_change', {
      from: prevStatusFilterRef.current,
      to: statusFilter,
      resultCount: filteredTotal,
    });
    prevStatusFilterRef.current = statusFilter;
  }, [statusFilter, filteredTotal]);

  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearch) return;
    uxLogger.event('payment_search', {
      queryLength: debouncedSearch.trim().length,
      resultCount: filteredTotal,
    });
    prevDebouncedSearchRef.current = debouncedSearch;
  }, [debouncedSearch, filteredTotal]);

  const showActionBanner = useCallback((outcome: OperationOutcome) => {
    setActionBanner(
      outcomeToBannerItem(outcome, {
        dismissible: true,
        onDismiss: () => setActionBanner(null),
      })
    );
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
        actionLabel: copy.ajustes.retryFailed,
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

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchInput('');
  }, []);

  const openManualRegister = useCallback(() => {
    setShowManual(true);
  }, []);

  const openDetail = useCallback(
    (entry: PaymentRegisterCacheEntry) => {
      setDetailFeedback(null);
      setAssigningClientId(null);
      setSelected(entry);
      cardOpenTimeRef.current = Date.now();
      uxLogger.event('payment_card_open', {
        syncStatus: entry.syncStatus,
        filterActive: statusFilter !== 'all' || Boolean(debouncedSearch.trim()),
        hadActionHint: Boolean(getPaymentActionHint(entry)),
      });
      detailRef.current?.expand();
    },
    [statusFilter, debouncedSearch]
  );

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
    void queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.filterCounts() });
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
      reportOutcomeWithPolicy(syncOutcome, { anchor: 'list', isUserInitiated: true });

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentRegisters.filterCounts() });
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
        reportOutcomeWithPolicy(outcome, { anchor: 'detail-sheet' });
        if (result.entry) setSelected(result.entry);
        if (result.status === 'completed' && cardOpenTimeRef.current) {
          uxLogger.event('payment_confirm_from_filter', {
            durationMs: Date.now() - cardOpenTimeRef.current,
            filterActive: statusFilter !== 'all' || Boolean(debouncedSearch.trim()),
          });
        }
      },
      onError: (error) => {
        const outcome = formatErrorOutcome(
          'confirm_payment',
          error,
          'No se pudo confirmar el pago.'
        );
        setDetailFeedback(outcome);
        reportOutcomeWithPolicy(outcome, { anchor: 'detail-sheet' });
      },
    });
  }, [selected, confirmPayment, statusFilter, debouncedSearch]);

  const handleAssignClient = useCallback(() => {
    detailRef.current?.close();
    assignRef.current?.expand();
  }, []);

  const handleBackFromAssign = useCallback(() => {
    assignRef.current?.close();
    detailRef.current?.expand();
  }, []);

  const handleCompleteManual = useCallback(() => {
    if (!selected) return;
    detailRef.current?.close();
    setManualName(selected.name ?? '');
    setManualPago(selected.pago);
    setManualMobile(selected.mobile === 'sin-leer' ? '' : selected.mobile);
    setManualRef(selected.ref);
    setManualDate(selected.paymentDate);
    setManualTime(selected.paymentTime);
    setShowManual(true);
  }, [selected]);

  const handleAssign = useCallback(
    (clientId: string, clientName: string) => {
      if (!selected) return;
      setAssigningClientId(clientId);
      assignClient.mutate(
        { localId: selected.localId, clientId, clientName },
        {
          onSuccess: (result) => {
            const outcome = formatAssignClientOutcome(result, clientName);
            reportOutcomeWithPolicy(outcome, { anchor: 'detail-sheet' });
            showActionBanner(outcome);
            resetAssignSheetDraft();

            if (result.status === 'completed' || result.status === 'already_done') {
              resetPaymentWorkflow();
              return;
            }

            assignRef.current?.close();
            if (result.entry) {
              setSelected(result.entry);
              detailRef.current?.expand();
            }
          },
          onError: (error) => {
            setAssigningClientId(null);
            const outcome = formatErrorOutcome(
              'assign_client',
              error,
              'No se pudo asociar el cliente.'
            );
            showActionBanner(outcome);
            reportOutcomeWithPolicy(outcome, { anchor: 'detail-sheet' });
          },
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

  const headerRight = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.pagos.manualRegister}
      onPress={openManualRegister}
      hitSlop={8}
      style={styles.headerButton}
    >
      <Plus color={colors.primary} size={24} />
    </Pressable>
  );

  const filterBar = !cacheEmpty && !showManual ? (
    <PaymentFilterBar
      status={statusFilter}
      search={searchInput}
      counts={filterCounts}
      filteredTotal={filteredTotal}
      onStatusChange={setStatusFilter}
      onSearchChange={setSearchInput}
    />
  ) : null;

  if (isLoading) {
    return (
      <AppScreen
        title={copy.pagos.title}
        subtitle={copy.pagos.loading}
        scroll={false}
        brandLogo
        headerRight={headerRight}
      >
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={copy.pagos.title}
      subtitle={copy.pagos.subtitle}
      scroll={false}
      brandLogo
      headerRight={headerRight}
    >
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
          onCancel={() => setShowManual(false)}
          isSubmitting={manualRegister.isPending}
        />
      ) : null}

      {cacheEmpty && !showManual ? (
        <EmptyState
          title={copy.pagos.emptyTitle}
          description={copy.pagos.emptyDescription}
          action={
            <PrimaryButton
              label={copy.pagos.manualRegister}
              onPress={openManualRegister}
            />
          }
        />
      ) : null}

      {!cacheEmpty && !showManual && entries.length === 0 ? (
        <>
          {filterBar}
          <EmptyState
            title={copy.pagos.filters.emptyTitle}
            description={copy.pagos.filters.emptyDescription}
            action={
              hasActiveFilter ? (
                <PrimaryButton
                  label={copy.pagos.filters.clearFilters}
                  onPress={clearFilters}
                />
              ) : undefined
            }
          />
        </>
      ) : null}

      {!cacheEmpty && !showManual && entries.length > 0 ? (
        <FlashList
          data={listRows}
          keyExtractor={(item) => item.key}
          getItemType={(item) => item.type}
          contentContainerStyle={styles.list}
          ListHeaderComponent={filterBar}
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
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <SectionHeader title={item.title} />
            ) : (
              <PaymentRegisterCard entry={item.entry} onPress={openDetail} />
            )
          }
          ListFooterComponent={
            hasNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
        />
      ) : null}

      <PaymentDetailSheet
        ref={detailRef}
        entry={selected}
        actionFeedback={detailFeedback}
        onConfirmPayment={handleConfirmPayment}
        onAssignClient={handleAssignClient}
        onCompleteManual={handleCompleteManual}
        isConfirming={confirmPayment.isPending}
      />

      <AssignClientSheet
        ref={assignRef}
        onAssign={handleAssign}
        onBack={handleBackFromAssign}
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
  headerButton: { padding: spacing.xs },
  sectionHeader: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
});
