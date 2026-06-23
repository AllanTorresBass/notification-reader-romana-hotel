export type ParseConfidence = 'high' | 'partial' | 'failed';

export type PaymentDateSource =
  | 'notification_text'
  | 'post_time'
  | 'manual'
  | 'remote_api'
  | 'unknown';

export interface ParsedPagomovil {
  name: string | null;
  pago: string;
  mobile: string;
  ref: string;
  paymentDate: string;
  paymentTime: string;
  dateSource: PaymentDateSource;
  confidence: ParseConfidence;
}

export interface PagomovilParseInput {
  title?: string | null;
  body?: string | null;
  bigText?: string | null;
}
