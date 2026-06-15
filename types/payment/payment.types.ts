export type PaymentType = 'efectivo_bs' | 'efectivo_usd' | 'pago_movil';

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
