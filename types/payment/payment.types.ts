export type PaymentType = 'efectivo_bs' | 'efectivo_usd' | 'pago_movil';

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  clientId: string;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  reference: string | null;
  paymentDate: string | null;
  paymentTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'efectivo_bs', label: 'Efectivo en Bs' },
  { value: 'efectivo_usd', label: 'Efectivo en $' },
  { value: 'pago_movil', label: 'Pago Móvil' },
];

export function isPagoMovil(paymentType: PaymentType): boolean {
  return paymentType === 'pago_movil';
}

export function getPaymentTypeLabel(paymentType: PaymentType | string): string {
  return PAYMENT_TYPES.find((t) => t.value === paymentType)?.label ?? paymentType;
}
