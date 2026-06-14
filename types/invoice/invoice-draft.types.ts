import type { InvoiceStatus, InvoiceLineItemInput } from '@/types/invoice/invoice.schemas';
import type { RecordPaymentInput } from '@/types/payment/payment.schemas';

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface BuildCreatePayloadInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  discount: number;
  currency: string;
  notes?: string | null;
  lineItems: InvoiceLineItemInput[];
  status: InvoiceStatus;
  payment?: RecordPaymentInput;
}
