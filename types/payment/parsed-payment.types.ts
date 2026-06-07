export type ParseConfidence = 'high' | 'partial' | 'failed';

export interface ParsedPagomovil {
  name: string | null;
  pago: string;
  mobile: string;
  ref: string;
  paymentDate: string;
  paymentTime: string;
  confidence: ParseConfidence;
}

export interface PagomovilParseInput {
  title?: string | null;
  body?: string | null;
  bigText?: string | null;
}
