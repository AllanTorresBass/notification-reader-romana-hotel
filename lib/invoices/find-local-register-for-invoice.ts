import { paymentRegisterCacheRepository } from '@/lib/services/payments/PaymentRegisterCacheRepository';
import { paymentReferencesMatch } from '@/types/invoice/invoice-search.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

async function loadEntries(): Promise<PaymentRegisterCacheEntry[]> {
  const { items } = await paymentRegisterCacheRepository.listSlice(0, 500);
  return items;
}

export async function findLocalRegisterByInvoiceId(
  invoiceId: string
): Promise<PaymentRegisterCacheEntry | null> {
  const entries = await loadEntries();
  return entries.find((entry) => entry.remoteInvoiceId === invoiceId) ?? null;
}

export async function findLocalRegisterByReference(
  reference: string
): Promise<PaymentRegisterCacheEntry | null> {
  const entries = await loadEntries();
  return entries.find((entry) => paymentReferencesMatch(reference, entry.ref)) ?? null;
}
