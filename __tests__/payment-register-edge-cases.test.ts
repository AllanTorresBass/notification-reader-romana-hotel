import {
  normalizePagoAmount,
  parsePagomovilNotification,
} from '@/lib/utils/bdv-pagomovil-parser';

describe('bdv-pagomovil edge cases', () => {
  it('handles alternate spacing in notification', () => {
    const result = parsePagomovilNotification({
      body: 'Recibiste un PagomovilBDV por Bs. 1.500,50 del 0414-9998877 Ref: 111222333444 en fecha 06-06-26 hora: 09:05.',
    });
    expect(result.confidence).toBe('high');
    expect(result.pago).toBe('1500.50');
  });

  it('handles amount without thousands separator', () => {
    expect(normalizePagoAmount('15000,00')).toBe('15000.00');
  });

  it('returns partial when body is redacted-like (no ref)', () => {
    const result = parsePagomovilNotification({
      title: 'PagomovilBDV recibido',
      body: 'Recibiste un PagomovilBDV por Bs.15.000,00 del 0412-1222392',
    });
    expect(result.confidence).toBe('partial');
    expect(result.ref).toBe('');
  });
});
