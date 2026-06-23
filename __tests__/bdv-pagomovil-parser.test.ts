import {
  combineNotificationText,
  isPagomovilNotification,
  normalizePagoAmount,
  parsePagomovilNotification,
  parseVenezuelanDate,
  postTimeToPaymentFields,
} from '@/lib/utils/bdv-pagomovil-parser';

const TYPE_A_ANGELA =
  '"Recibiste un PagomovilBDV de ANGELA ROSA RODRIGUEZ URDANETA por Bs.10,00 bajo el numero de operacion 006280856778"';

const TYPE_B =
  'Recibiste un PagomovilBDV por Bs.18,00 del 0412-1222392 Ref: 122506909857 en fecha 06-06-26 hora: 12:24.';

const TYPE_A_BENHURT =
  '"Recibiste un PagomovilBDV de BENHURT RAFAEL ANDRADE RODRIGUEZ por Bs.1,00 bajo el numero de operacion 006280816011"';

const POST_TIME = new Date('2026-06-06T12:24:00').getTime();

describe('bdv-pagomovil-parser', () => {
  it('detects Pagomóvil from title or body', () => {
    expect(isPagomovilNotification({ title: 'PagomovilBDV recibido' })).toBe(true);
    expect(isPagomovilNotification({ body: TYPE_A_ANGELA })).toBe(true);
    expect(isPagomovilNotification({ title: 'Transferencia' })).toBe(false);
  });

  it('parses Type B (phone + ref + fecha + hora)', () => {
    const result = parsePagomovilNotification({
      title: 'PagomovilBDV recibido',
      body: TYPE_B,
    });

    expect(result.confidence).toBe('high');
    expect(result.pago).toBe('18.00');
    expect(result.mobile).toBe('0412-1222392');
    expect(result.ref).toBe('122506909857');
    expect(result.paymentDate).toBe('2026-06-06');
    expect(result.paymentTime).toBe('12:24');
    expect(result.dateSource).toBe('notification_text');
    expect(result.name).toBeNull();
  });

  it('parses Type A (name + operation number) with quotes', () => {
    const result = parsePagomovilNotification(
      { title: 'PagomovilBDV recibido', body: TYPE_A_ANGELA },
      POST_TIME
    );

    expect(result.confidence).toBe('high');
    expect(result.name).toBe('ANGELA ROSA RODRIGUEZ URDANETA');
    expect(result.pago).toBe('10.00');
    expect(result.mobile).toBe('sin-telefono');
    expect(result.ref).toBe('006280856778');
    expect(result.paymentDate).toBe('2026-06-06');
    expect(result.dateSource).toBe('post_time');
  });

  it('parses Type A for BENHURT notification', () => {
    const result = parsePagomovilNotification({ body: TYPE_A_BENHURT }, POST_TIME);
    expect(result.pago).toBe('1.00');
    expect(result.name).toBe('BENHURT RAFAEL ANDRADE RODRIGUEZ');
    expect(result.ref).toBe('006280816011');
  });

  it('normalizes amount variants', () => {
    expect(normalizePagoAmount('15.000,00')).toBe('15000.00');
    expect(normalizePagoAmount('10,00')).toBe('10.00');
  });

  it('parses Venezuelan dates', () => {
    expect(parseVenezuelanDate('06-06-26')).toBe('2026-06-06');
  });

  it('derives date from notification postTime', () => {
    const { paymentDate, paymentTime } = postTimeToPaymentFields(POST_TIME);
    expect(paymentDate).toBe('2026-06-06');
    expect(paymentTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns failed on empty text', () => {
    expect(parsePagomovilNotification({ title: '', body: '' }).confidence).toBe('failed');
  });
});
