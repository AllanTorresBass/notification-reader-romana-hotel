import type { GymService } from '@/types/service/service.types';
import type { InvoiceCreateInput, InvoiceLineItemInput } from '@/types/invoice/invoice.schemas';
import type {
  BuildCreatePayloadInput,
  InvoiceTotals,
} from '@/types/invoice/invoice-draft.types';
import type { PaymentFormValues } from '@/types/payment/payment.schemas';
import type { PaymentType } from '@/types/payment/payment.types';

export type { InvoiceTotals, BuildCreatePayloadInput };

export function computeInvoiceTotals(
  lineItems: InvoiceLineItemInput[],
  taxRate: number,
  discount: number
): InvoiceTotals {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;
  return { subtotal, taxAmount, total };
}

export function buildLineItemFromService(
  service: GymService,
  quantity = 1
): InvoiceLineItemInput {
  return {
    serviceId: service.id,
    serviceName: service.name,
    description: service.description,
    quantity,
    unitPrice: service.price,
  };
}

export function defaultPaymentTypeForCurrency(currency: string): PaymentType {
  return currency === 'USD' ? 'efectivo_usd' : 'efectivo_bs';
}

export function getDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return { today, dueDate };
}

export function getDefaultPaymentValues(): PaymentFormValues {
  const { today } = getDefaultDates();
  return {
    paymentType: 'efectivo_bs',
    reference: '',
    paymentDate: today,
    paymentTime: new Date().toTimeString().slice(0, 5),
  };
}

export function buildCreatePayload(input: BuildCreatePayloadInput): InvoiceCreateInput {
  return {
    clientId: input.clientId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    taxRate: input.taxRate,
    discount: input.discount,
    currency: input.currency,
    notes: input.notes ?? null,
    lineItems: input.lineItems,
    status: input.status,
    payment: input.payment,
  };
}
