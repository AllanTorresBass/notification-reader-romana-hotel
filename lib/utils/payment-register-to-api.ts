import { BANCO_DE_VENEZUELA_LABEL } from '@/constants/whitelist-defaults';
import type { CreatePaymentInput, UpdatePaymentInput } from '@/lib/api-client/payments/PaymentApiService';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function resolveReference(entry: PaymentRegisterCacheEntry): string {
  const ref = entry.ref.trim();
  if (ref) return ref;
  return `NK-${entry.notificationKey.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || entry.localId.slice(-12)}`;
}

function resolvePaymentDate(entry: PaymentRegisterCacheEntry): string {
  if (entry.paymentDate.trim()) return entry.paymentDate;
  return new Date(entry.createdAt).toISOString().split('T')[0];
}

function resolvePaymentTime(entry: PaymentRegisterCacheEntry): string {
  if (entry.paymentTime.trim()) return entry.paymentTime;
  return new Date(entry.createdAt).toTimeString().slice(0, 5);
}

function resolveStatus(entry: PaymentRegisterCacheEntry): 'confirmado' | 'pendiente' {
  const hasRef = Boolean(entry.ref.trim());
  const hasDate = Boolean(entry.paymentDate.trim() && entry.paymentTime.trim());
  return hasRef && hasDate ? 'confirmado' : 'pendiente';
}

export function cacheEntryToCreatePaymentInput(
  entry: PaymentRegisterCacheEntry
): CreatePaymentInput {
  return {
    reference: resolveReference(entry),
    amount: entry.pago,
    payerName: entry.name,
    payerPhone: entry.mobile,
    bank: BANCO_DE_VENEZUELA_LABEL,
    status: resolveStatus(entry),
    paymentDate: resolvePaymentDate(entry),
    paymentTime: resolvePaymentTime(entry),
    notificationKey: entry.notificationKey,
    source: 'mobile',
  };
}

export function cacheEntryToUpdatePaymentInput(
  entry: PaymentRegisterCacheEntry
): UpdatePaymentInput {
  return {
    reference: resolveReference(entry),
    amount: entry.pago,
    payerName: entry.name,
    payerPhone: entry.mobile,
    bank: BANCO_DE_VENEZUELA_LABEL,
    status: 'confirmado',
    paymentDate: resolvePaymentDate(entry),
    paymentTime: resolvePaymentTime(entry),
    notificationKey: entry.notificationKey,
    source: 'mobile',
  };
}
