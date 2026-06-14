import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { INVOICE_PAGE_SIZE } from '@/constants/storage-keys';
import { useAppFeedback } from '@/hooks/use-app-feedback';
import { copy } from '@/constants/copy';
import { queryKeys } from '@/lib/query-keys';
import { invoiceApiService } from '@/lib/api-client/invoices/InvoiceApiService';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import {
  normalizePaymentReference,
  paymentReferenceSuffix,
  PAYMENT_REFERENCE_SUFFIX_LENGTH,
} from '@/types/invoice/invoice-search.types';
import type { InvoiceCreateInput, InvoiceListParamsInput } from '@/types/invoice/invoice.schemas';

type InvoiceListQueryParams = Omit<InvoiceListParamsInput, 'page'>;

export function useInvoicesInfiniteQuery(
  params: InvoiceListQueryParams = {},
  enabled = true
) {
  const { reportError } = useAppFeedback();

  return useInfiniteQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await invoiceApiService.list({
          ...params,
          page: pageParam,
          limit: params.limit ?? INVOICE_PAGE_SIZE,
        });
      } catch (error) {
        reportError('invoice_list_fetch', error, copy.facturas.listLoadError, 'fetch', {
          presentationContext: { anchor: 'list' },
        });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  });
}

export function useInvoiceReferenceLookupQuery(reference: string, enabled = true) {
  const { reportError } = useAppFeedback();
  const normalized = normalizePaymentReference(reference);
  const suffix = paymentReferenceSuffix(reference);

  return useQuery({
    queryKey: queryKeys.invoices.byReference(suffix),
    queryFn: async () => {
      try {
        return await invoiceApiService.getByPaymentReference(normalized);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          return null;
        }
        reportError('invoice_list_fetch', error, copy.facturas.search.lookupError, 'fetch', {
          presentationContext: { anchor: 'list' },
        });
        throw error;
      }
    },
    enabled: enabled && normalized.length >= PAYMENT_REFERENCE_SUFFIX_LENGTH,
    retry: false,
  });
}

export function useInvoiceQuery(id: string, enabled = true) {
  const { reportError } = useAppFeedback();

  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: async () => {
      try {
        return await invoiceApiService.get(id);
      } catch (error) {
        reportError('invoice_detail_fetch', error, copy.facturas.detailLoadError, 'fetch', {
          presentationContext: { anchor: 'screen' },
        });
        throw error;
      }
    },
    enabled: enabled && !!id,
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceCreateInput) => invoiceApiService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}
