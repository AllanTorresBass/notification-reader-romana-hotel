export type PaymentDateTraceStage =
  | 'parse'
  | 'api_pull'
  | 'merge'
  | 'cache_repair'
  | 'display';

export interface PaymentDateTracePayload {
  stage: PaymentDateTraceStage;
  notificationKey?: string;
  remoteId?: string;
  rawDate?: unknown;
  rawTime?: unknown;
  normalizedDate?: string;
  normalizedTime?: string;
  policy?: string;
  output?: string;
}

export type PaymentDateTraceLogger = (message: string, payload: PaymentDateTracePayload) => void;

let traceLogger: PaymentDateTraceLogger | null = null;

export function setPaymentDateTraceLogger(logger: PaymentDateTraceLogger | null): void {
  traceLogger = logger;
}

export function tracePaymentDate(payload: PaymentDateTracePayload): void {
  traceLogger?.('[PaymentDateTrace]', payload);
}

export function tracePaymentDatePipeline(
  stage: PaymentDateTraceStage,
  fields: Omit<PaymentDateTracePayload, 'stage'>
): void {
  tracePaymentDate({ stage, ...fields });
}
