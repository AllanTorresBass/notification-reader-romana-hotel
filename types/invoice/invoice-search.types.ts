export type InvoiceSearchMode = 'general' | 'reference';

export const PAYMENT_REFERENCE_SUFFIX_LENGTH = 4;

export function normalizePaymentReference(value: string): string {
  return value.replace(/\D/g, '');
}

export function paymentReferenceSuffix(value: string): string {
  const digits = normalizePaymentReference(value);
  return digits.length >= PAYMENT_REFERENCE_SUFFIX_LENGTH
    ? digits.slice(-PAYMENT_REFERENCE_SUFFIX_LENGTH)
    : digits;
}

export function inferInvoiceSearchMode(query: string): InvoiceSearchMode {
  const digits = normalizePaymentReference(query);
  return digits.length >= PAYMENT_REFERENCE_SUFFIX_LENGTH ? 'reference' : 'general';
}

export function paymentReferencesMatch(query: string, stored: string): boolean {
  const suffix = paymentReferenceSuffix(query);
  if (suffix.length < PAYMENT_REFERENCE_SUFFIX_LENGTH) return false;
  const storedDigits = normalizePaymentReference(stored);
  return (
    storedDigits.slice(-PAYMENT_REFERENCE_SUFFIX_LENGTH) === suffix
  );
}
