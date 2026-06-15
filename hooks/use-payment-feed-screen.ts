import BottomSheet from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BannerItem } from '@/components/ui/Banner';
import { copy } from '@/constants/copy';
import { useApiAuthStatus, useIsApiAuthenticated, useLastSyncError } from '@/hooks/use-api-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useConfirmPaymentMutation,
  useManualRegisterMutation,
  usePaymentFilterCountsQuery,
  usePaymentRegistersInfiniteQuery,
  usePendingLocalSyncCountQuery,
  usePaymentSyncStatusQuery,
  useQueueRetryMutation,
} from '@/hooks/use-payment-registers';
import { useNotificationShadeSync } from '@/hooks/use-notification-shade-sync';
import { uxLogger } from '@/lib/logger';
import {
  formatConfirmPaymentOutcome,
  formatErrorOutcome,
  formatPullSyncOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { reportShadeSyncOutcomeIfNeeded } from '@/lib/feedback/shade-sync-reporting';
import { outcomeToBannerItem } from '@/lib/feedback/outcome-to-banner';
import { reportOutcome, reportError, reportOutcomeWithPolicy } from '@/lib/feedback/report-feedback';
import { queryKeys } from '@/lib/query-keys';
import { paymentSyncOrchestrator } from '@/lib/services/payments/PaymentSyncOrchestrator';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';
import { getPaymentActionHint, getPaymentActionKind, resolvePaymentAction } from '@/lib/utils/filter-payment-registers';
import { paymentSyncQueue } from '@/lib/services/sync/payment-sync-queue';
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

const DEFAULT_STATUS_FILTER: PaymentStatusFilter = 'all';

export function usePaymentFeedScreen() {
  const router = useRouter();
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
  const cardOpenTimeRef = useRef<number | null>(null);
  const prevStatusFilterRef = useRef(statusFilter);
  const prevDebouncedSearchRef = useRef('');

  const detailRef = useRef<BottomSheet>(null);

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
  const manualRegister = useManualRegisterMutation();
  const queueRetry = useQueueRetryMutation();
  const { data: pendingLocalSync = 0 } = usePendingLocalSyncCountQuery();
  const { data: pendingQueueJobs = 0 } = usePaymentSyncStatusQuery();
  const { syncFromShade } = useNotificationShadeSync();

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const filteredTotal = data?.pages[0]?.total ?? 0;
  const cacheEmpty = (filterCounts?.all ?? 0) === 0;
  const hasActiveFilter =
    statusFilter !== 'all' || searchInput.trim().length > 0;
  const showClearFiltersOnEmpty =
    hasActiveFilter && filteredTotal === 0 && (filterCounts?.all ?? 0) > 0;

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
    } else if (pendingQueueJobs > 0 && isAuthenticated) {
      items.push({
        id: 'queue-pending',
        message: copy.pagos.queuePending(pendingQueueJobs),
        variant: 'warning',
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
    pendingQueueJobs,
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
      setSelected(entry);
      cardOpenTimeRef.current = Date.now();
      const action = resolvePaymentAction(entry, { isAuthenticated });
      void paymentSyncQueue.hasPendingJobForLocalId(entry.localId).then((queuePendingForEntry) => {
        uxLogger.event('payment_card_open', {
          syncStatus: entry.syncStatus,
          failureClass: entry.failureClass ?? undefined,
          failureStage: entry.failureStage ?? undefined,
          hadRemoteId: Boolean(entry.remoteRegisterId),
          hadActionHint: Boolean(action.hint),
          actionHintKind: getPaymentActionKind(entry, { isAuthenticated }),
          filterActive: statusFilter !== 'all' || Boolean(debouncedSearch.trim()),
          activeFilter: statusFilter,
          queuePendingForEntry,
        });
      });
      detailRef.current?.expand();
    },
    [statusFilter, debouncedSearch, isAuthenticated]
  );

  const refresh = useCallback(async () => {
    try {
      const shade = await syncFromShade();
      reportShadeSyncOutcomeIfNeeded(shade, { toast: false, log: true });

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

  return {
    isLoading,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refresh,
    banners,
    showManual,
    openManualRegister,
    cacheEmpty,
    entries,
    listRows,
    hasActiveFilter,
    showClearFiltersOnEmpty,
    clearFilters,
    statusFilter,
    searchInput,
    setStatusFilter,
    setSearchInput,
    filterCounts,
    filteredTotal,
    openDetail,
    manualName,
    manualPago,
    manualMobile,
    manualRef,
    manualDate,
    manualTime,
    setManualName,
    setManualPago,
    setManualMobile,
    setManualRef,
    setManualDate,
    setManualTime,
    submitManual,
    setShowManual,
    manualRegister,
    detailRef,
    selected,
    detailFeedback,
    handleConfirmPayment,
    handleCompleteManual,
    confirmPayment,
  };
}
