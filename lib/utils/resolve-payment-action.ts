import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import type {
  PaymentActionKind,
  ResolvedPaymentAction,
} from '@/types/payment/payment-sync-failure.types';

export interface ResolvePaymentActionOptions {
  isAuthenticated?: boolean;
}

function hasRequiredPaymentData(entry: PaymentRegisterCacheEntry): boolean {
  return Boolean(entry.ref.trim() && entry.paymentDate.trim());
}

function hasSyncableMobile(mobile: string): boolean {
  const trimmed = mobile.trim();
  return Boolean(trimmed) && trimmed !== 'sin-leer' && trimmed !== 'sin-telefono';
}

export function resolvePaymentAction(
  entry: PaymentRegisterCacheEntry,
  options: ResolvePaymentActionOptions = {}
): ResolvedPaymentAction {
  const isAuthenticated = options.isAuthenticated ?? true;

  if (entry.syncStatus === 'payment_confirmed') {
    return { kind: 'none', hint: null, actionable: false };
  }

  if (!hasRequiredPaymentData(entry) || !hasSyncableMobile(entry.mobile)) {
    return { kind: 'complete_data', hint: 'Completar datos →', actionable: true };
  }

  if (!isAuthenticated) {
    return { kind: 'login_required', hint: 'Iniciar sesión →', actionable: true };
  }

  if (entry.syncStatus === 'pending_sync') {
    return { kind: 'pending_sync', hint: 'Pendiente de sync', actionable: false };
  }

  if (entry.syncStatus === 'sync_failed' && entry.remoteRegisterId) {
    return { kind: 'confirm_payment', hint: 'Confirmar pago →', actionable: true };
  }

  if (entry.syncStatus === 'sync_failed' || !entry.remoteRegisterId) {
    return {
      kind: 'sync_and_confirm',
      hint: 'Sincronizar y confirmar →',
      actionable: true,
    };
  }

  if (entry.syncStatus === 'synced') {
    return { kind: 'confirm_payment', hint: 'Confirmar pago →', actionable: true };
  }

  return { kind: 'none', hint: null, actionable: false };
}

export function getPaymentActionHint(
  entry: PaymentRegisterCacheEntry,
  options?: ResolvePaymentActionOptions
): string | null {
  return resolvePaymentAction(entry, options).hint;
}

export function getPaymentActionKind(
  entry: PaymentRegisterCacheEntry,
  options?: ResolvePaymentActionOptions
): PaymentActionKind {
  return resolvePaymentAction(entry, options).kind;
}
