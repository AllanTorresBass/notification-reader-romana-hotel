import type { PagomovilParseInput, ParsedPagomovil, ParseConfidence } from '@/types/payment/parsed-payment.types';

const PAGOMOVIL_TITLE = /pagom[oó]vil/i;
const PAGOMOVIL_BODY = /recibiste un pagom[oó]vil/i;
const PAGOMOVIL_AMOUNT = /por\s+Bs\.?\s*[\d.,]+/i;
const PAGOMOVIL_OPERATION = /numero de operacion|n[uú]mero de operaci[oó]n/i;

/** Type B: por Bs.X del PHONE Ref: REF en fecha DD-MM-YY hora: HH:MM */
const TYPE_B_RE =
  /Recibiste un Pagom[oó]vilBDV por Bs\.?\s*([\d.,]+)\s+del\s+([\d-]+)\s+Ref:\s*(\S+)\s+en\s+fecha\s+(\S+)\s+hora:\s*(\d{1,2}:\d{2})/i;

/** Type A: de NAME por Bs.X bajo el numero de operacion NNN */
const TYPE_A_RE =
  /Recibiste un Pagom[oó]vilBDV de (.+?) por Bs\.?\s*([\d.,]+)\s+bajo el n[uú]mero de operaci[oó]n\s+(\d+)/i;

export function isPagomovilNotification(input: PagomovilParseInput): boolean {
  const text = combineNotificationText(input);
  if (!text) return false;
  return (
    PAGOMOVIL_TITLE.test(text) ||
    PAGOMOVIL_BODY.test(text) ||
    (PAGOMOVIL_AMOUNT.test(text) && (/ref:/i.test(text) || PAGOMOVIL_OPERATION.test(text)))
  );
}

export function combineNotificationText(input: PagomovilParseInput): string {
  return [input.title, input.bigText, input.body]
    .filter((part) => part?.trim())
    .join(' ')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize Venezuelan amount "15.000,00" → "15000.00" */
export function normalizePagoAmount(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes(',')) {
    const withoutThousands = trimmed.replace(/\./g, '');
    const normalized = withoutThousands.replace(',', '.');
    const num = Number.parseFloat(normalized);
    if (Number.isNaN(num)) {
      throw new Error(`Invalid amount: ${raw}`);
    }
    return num.toFixed(2);
  }
  const num = Number.parseFloat(trimmed);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid amount: ${raw}`);
  }
  return num.toFixed(2);
}

/** Parse DD-MM-YY or DD-MM-YYYY → YYYY-MM-DD */
export function parseVenezuelanDate(raw: string): string {
  const parts = raw.trim().split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date: ${raw}`);
  }
  const [day, month, yearPart] = parts;
  const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function postTimeToPaymentFields(postTime: number): {
  paymentDate: string;
  paymentTime: string;
} {
  const d = new Date(postTime);
  return {
    paymentDate: d.toISOString().split('T')[0],
    paymentTime: d.toTimeString().slice(0, 5),
  };
}

function normalizeTime(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.length === 4 ? `0${trimmed}` : trimmed;
}

export function parsePagomovilNotification(
  input: PagomovilParseInput,
  postTime?: number
): ParsedPagomovil {
  const text = combineNotificationText(input);
  const failed: ParsedPagomovil = {
    name: null,
    pago: '',
    mobile: '',
    ref: '',
    paymentDate: '',
    paymentTime: '',
    confidence: 'failed',
  };

  if (!text) {
    return failed;
  }

  const typeB = text.match(TYPE_B_RE);
  if (typeB) {
    let confidence: ParseConfidence = 'high';
    let paymentDate = '';
    try {
      paymentDate = parseVenezuelanDate(typeB[4]);
    } catch {
      confidence = 'partial';
      if (postTime) {
        paymentDate = postTimeToPaymentFields(postTime).paymentDate;
      }
    }
    return {
      name: null,
      pago: normalizePagoAmount(typeB[1]),
      mobile: typeB[2].trim(),
      ref: typeB[3].trim(),
      paymentDate,
      paymentTime: normalizeTime(typeB[5]),
      confidence,
    };
  }

  const typeA = text.match(TYPE_A_RE);
  if (typeA) {
    const fallback = postTime ? postTimeToPaymentFields(postTime) : { paymentDate: '', paymentTime: '' };
    return {
      name: typeA[1].trim(),
      pago: normalizePagoAmount(typeA[2]),
      mobile: 'sin-telefono',
      ref: typeA[3].trim(),
      paymentDate: fallback.paymentDate,
      paymentTime: fallback.paymentTime,
      confidence: postTime ? 'high' : 'partial',
    };
  }

  const partialAmount = text.match(/por\s+Bs\.?\s*([\d.,]+)/i);
  const partialMobile = text.match(/del\s+([\d-]+)/i);
  if (partialAmount) {
    return {
      ...failed,
      confidence: 'partial',
      pago: normalizePagoAmount(partialAmount[1]),
      mobile: partialMobile?.[1]?.trim() ?? '',
    };
  }

  return failed;
}
