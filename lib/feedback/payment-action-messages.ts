import { copy } from '@/constants/copy';
import { formatPagoDisplay } from '@/lib/utils/format-pago';
import type { ActionDispatchStatus } from '@/types/payment/payment-action-result.types';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

export function paymentSummary(entry: PaymentRegisterCacheEntry | null): string {
  if (!entry) return '';
  const parts = [`Bs. ${formatPagoDisplay(entry.pago)}`];
  if (entry.ref) parts.push(`Ref. ${entry.ref}`);
  return parts.join(' · ');
}

export function formatConfirmPaymentMessages(
  entry: PaymentRegisterCacheEntry | null,
  status: ActionDispatchStatus
): { title: string; message: string } {
  const summary = paymentSummary(entry);

  if (status === 'already_done') {
    return {
      title: copy.pagos.actions.confirm.alreadyTitle,
      message: summary
        ? copy.pagos.actions.confirm.alreadyMessage(summary)
        : copy.pagos.actions.confirm.alreadyMessageGeneric,
    };
  }

  if (status === 'queued') {
    return {
      title: copy.pagos.actions.confirm.queuedTitle,
      message: summary
        ? copy.pagos.actions.confirm.queuedMessage(summary)
        : copy.pagos.actions.confirm.queuedMessageGeneric,
    };
  }

  return {
    title: copy.pagos.actions.confirm.completedTitle,
    message: summary
      ? copy.pagos.actions.confirm.completedMessage(summary)
      : copy.pagos.actions.confirm.completedMessageGeneric,
  };
}

export function formatAssignClientMessages(
  entry: PaymentRegisterCacheEntry | null,
  status: ActionDispatchStatus,
  clientName?: string
): { title: string; message: string } {
  const summary = paymentSummary(entry);
  const client = clientName?.trim() || copy.pagos.actions.assign.clientFallback;

  if (status === 'already_done') {
    return {
      title: copy.pagos.actions.assign.alreadyTitle,
      message: copy.pagos.actions.assign.alreadyMessage(client, summary),
    };
  }

  if (status === 'queued') {
    return {
      title: copy.pagos.actions.assign.queuedTitle,
      message: copy.pagos.actions.assign.queuedMessage(client, summary),
    };
  }

  return {
    title: copy.pagos.actions.assign.completedTitle,
    message: copy.pagos.actions.assign.completedMessage(client, summary),
  };
}
