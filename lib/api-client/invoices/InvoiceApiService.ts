import { BaseApiClient } from '@/lib/api-client/base/BaseApiClient';
import type { InvoiceCreateInput, InvoiceListParamsInput } from '@/types/invoice/invoice.schemas';
import type { Invoice, PaginatedInvoicesResponse } from '@/types/invoice/invoice.types';

export class InvoiceApiService extends BaseApiClient {
  async list(params: InvoiceListParamsInput = {}): Promise<PaginatedInvoicesResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const query = searchParams.toString();
    return this.request<PaginatedInvoicesResponse>(
      `/api/v1/invoices${query ? `?${query}` : ''}`
    );
  }

  async get(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/invoices/${id}`);
  }

  async create(input: InvoiceCreateInput): Promise<Invoice> {
    return this.request<Invoice>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export const invoiceApiService = new InvoiceApiService();
