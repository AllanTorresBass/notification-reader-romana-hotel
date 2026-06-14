import { useMemo, useState } from 'react';

import { copy } from '@/constants/copy';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIsApiAuthenticated } from '@/hooks/use-api-auth';
import {
  useInvoiceReferenceLookupQuery,
  useInvoicesInfiniteQuery,
} from '@/hooks/use-invoices';
import { findLocalRegisterByReference } from '@/lib/invoices/find-local-register-for-invoice';
import {
  inferInvoiceSearchMode,
  normalizePaymentReference,
  paymentReferenceSuffix,
  PAYMENT_REFERENCE_SUFFIX_LENGTH,
} from '@/types/invoice/invoice-search.types';
import type { InvoiceStatus } from '@/types/invoice/invoice.schemas';
import type { InvoiceStatusFilter } from '@/components/invoices/InvoiceFilterBar';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import { useQuery } from '@tanstack/react-query';

export function useInvoicesScreen() {
  const isAuthenticated = useIsApiAuthenticated();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
  const searchMode = inferInvoiceSearchMode(debouncedSearch);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: status === 'all' ? undefined : (status as InvoiceStatus),
    }),
    [debouncedSearch, status]
  );

  const listQuery = useInvoicesInfiniteQuery(listParams, isAuthenticated);
  const referenceQuery = useInvoiceReferenceLookupQuery(
    debouncedSearch,
    isAuthenticated && searchMode === 'reference'
  );

  const localRegisterQuery = useQuery({
    queryKey: ['local-register-by-ref', paymentReferenceSuffix(debouncedSearch)],
    queryFn: () => findLocalRegisterByReference(debouncedSearch),
    enabled: debouncedSearch.trim().length > 0,
  });

  const listInvoices = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [listQuery.data]
  );

  const totalCount = listQuery.data?.pages[0]?.total ?? listInvoices.length;

  const invoices = useMemo(() => {
    if (searchMode === 'reference' && referenceQuery.data) {
      const ids = new Set(listInvoices.map((invoice) => invoice.id));
      if (!ids.has(referenceQuery.data.id)) {
        return [referenceQuery.data, ...listInvoices];
      }
    }
    return listInvoices;
  }, [listInvoices, referenceQuery.data, searchMode]);

  const referenceHint =
    search.trim().length > 0 &&
    searchMode === 'general' &&
    normalizePaymentReference(search).length > 0 &&
    normalizePaymentReference(search).length < PAYMENT_REFERENCE_SUFFIX_LENGTH
      ? copy.facturas.search.referenceHint
      : undefined;

  const emptyTitle =
    debouncedSearch.trim().length > 0
      ? copy.facturas.search.noResults(debouncedSearch.trim())
      : copy.facturas.emptyTitle;

  const emptyDescription =
    debouncedSearch.trim().length > 0
      ? copy.facturas.search.noResultsHint
      : copy.facturas.emptyDescription;

  const localRegister = localRegisterQuery.data as PaymentRegisterCacheEntry | null | undefined;

  return {
    isAuthenticated,
    search,
    setSearch,
    status,
    setStatus,
    debouncedSearch,
    searchMode,
    invoices,
    totalCount,
    resultCount: invoices.length,
    referenceHint,
    emptyTitle,
    emptyDescription,
    localRegister,
    showLocalMatchBanner:
      Boolean(localRegister) &&
      debouncedSearch.trim().length > 0 &&
      invoices.length === 0 &&
      !listQuery.isLoading,
    isLoading: listQuery.isLoading || referenceQuery.isLoading,
    isError: listQuery.isError,
    isRefetching: listQuery.isRefetching,
    hasNextPage: listQuery.hasNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    refetch: listQuery.refetch,
  };
}
