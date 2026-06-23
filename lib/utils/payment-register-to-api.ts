import { BANCO_DE_VENEZUELA_LABEL } from '@/constants/whitelist-defaults';
import type { CreatePaymentInput, UpdatePaymentInput } from '@/lib/api-client/payments/PaymentApiService';
import { normalizePagoAmount } from '@/lib/utils/bdv-pagomovil-parser';
import {
  instantToCaracasDateKey,
  instantToCaracasWallTime,
  normalizePaymentDate,
  normalizePaymentTime,
} from '@/lib/utils/format-payment-datetime';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function resolveReference(entry: PaymentRegisterCacheEntry): string {
  const ref = entry.ref.trim();
  if (ref) return ref;
  return `NK-${entry.notificationKey.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || entry.localId.slice(-12)}`;
}

function resolvePaymentDate(entry: PaymentRegisterCacheEntry): string {
  return normalizePaymentDate(entry.paymentDate) || instantToCaracasDateKey(entry.createdAt);
}

function resolvePaymentTime(entry: PaymentRegisterCacheEntry): string {
  if (entry.paymentTime.trim()) return normalizePaymentTime(entry.paymentTime);
  return instantToCaracasWallTime(entry.createdAt);
}

function resolveStatus(entry: PaymentRegisterCacheEntry): 'confirmado' | 'pendiente' {
  const hasRef = Boolean(entry.ref.trim());
  const hasDate = Boolean(entry.paymentDate.trim() && entry.paymentTime.trim());
  return hasRef && hasDate ? 'confirmado' : 'pendiente';
}

function optionalString(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** API amount must match /^\\d+(\\.\\d{1,2})?$/ — normalize Venezuelan formats first. */
export function resolveApiAmount(pago: string): string {
  const trimmed = pago.trim();
  if (!trimmed) return '0.00';

  if (trimmed.includes(',')) {
    return normalizePagoAmount(trimmed);
  }

  // Thousands separator without decimals: 15.000 → 15000.00
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    const withoutThousands = trimmed.replace(/\./g, '');
    return Number.parseFloat(withoutThousands).toFixed(2);
  }

  return normalizePagoAmount(trimmed);
}

function buildPaymentPayload(
  entry: PaymentRegisterCacheEntry,
  status: 'confirmado' | 'pendiente'
): CreatePaymentInput {
  return {
    reference: resolveReference(entry),
    amount: resolveApiAmount(entry.pago),
    payerName: optionalString(entry.name),
    payerPhone: isSyncableMobile(entry.mobile) ? optionalString(entry.mobile) : undefined,
    bank: BANCO_DE_VENEZUELA_LABEL,
    status,
    paymentDate: resolvePaymentDate(entry),
    paymentTime: resolvePaymentTime(entry),
    notificationKey: entry.notificationKey,
    source: 'mobile',
  };
}

export function cacheEntryToCreatePaymentInput(
  entry: PaymentRegisterCacheEntry
): CreatePaymentInput {
  return buildPaymentPayload(entry, resolveStatus(entry));
}

export function cacheEntryToUpdatePaymentInput(
  entry: PaymentRegisterCacheEntry
): UpdatePaymentInput {
  return buildPaymentPayload(entry, 'confirmado');
}

/** Create payload when confirming a payment that was never synced to the server. */
export function cacheEntryToConfirmedCreateInput(
  entry: PaymentRegisterCacheEntry
): CreatePaymentInput {
  return buildPaymentPayload(entry, 'confirmado');
}

function isSyncableMobile(mobile: string): boolean {
  const trimmed = mobile.trim();
  return Boolean(trimmed) && trimmed !== 'sin-leer' && trimmed !== 'sin-telefono';
}
