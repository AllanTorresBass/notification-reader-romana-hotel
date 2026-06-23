import { logger } from '@/lib/logger';
import {
  setPaymentDateTraceLogger,
  tracePaymentDate,
  type PaymentDateTracePayload,
} from '@la-romana/payment-datetime';

export function initPaymentDateTracing(): void {
  setPaymentDateTraceLogger((message, payload: PaymentDateTracePayload) => {
    logger.debug(message, payload);
  });
}

export function tracePaymentDatePipeline(
  payload: PaymentDateTracePayload
): void {
  tracePaymentDate(payload);
}
