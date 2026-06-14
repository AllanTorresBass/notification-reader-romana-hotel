import type { RemoteClient } from '@/lib/api-client/clients/ClientApiService';
import type { GymService } from '@/types/service/service.types';
import type { InvoicePayment } from '@/types/payment/payment.types';
import type { InvoiceStatus } from '@/types/invoice/invoice.schemas';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  serviceId: string;
  serviceName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  service?: GymService;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: RemoteClient;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  lineItems: InvoiceLineItem[];
  payment?: InvoicePayment;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginatedInvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
