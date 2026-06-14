import { countLabel } from '@/constants/feedback-copy-helpers';

describe('countLabel', () => {
  it('uses singular form for 1', () => {
    expect(countLabel(1, 'pago', 'pagos')).toBe('1 pago');
  });

  it('uses plural form for other counts', () => {
    expect(countLabel(3, 'pago', 'pagos')).toBe('3 pagos');
    expect(countLabel(0, 'pago', 'pagos')).toBe('0 pagos');
  });
});
