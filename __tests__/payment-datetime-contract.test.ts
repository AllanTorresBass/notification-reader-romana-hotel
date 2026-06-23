import {
  formatPaymentDateTime,
  normalizePaymentDate,
  normalizePaymentTime,
  verifyPaymentDatePipeline,
} from '@la-romana/payment-datetime';

describe('payment datetime API contract', () => {
  const apiFixture = {
    id: 15,
    paymentDate: '2026-06-23',
    paymentTime: '07:44:00',
    reference: '061743996724',
  };

  it('normalizes API JSON into cache-safe values', () => {
    expect(normalizePaymentDate(apiFixture.paymentDate)).toBe('2026-06-23');
    expect(normalizePaymentTime(apiFixture.paymentTime)).toBe('07:44');
  });

  it('renders card label from normalized cache values', () => {
    const label = formatPaymentDateTime(
      normalizePaymentDate(apiFixture.paymentDate),
      normalizePaymentTime(apiFixture.paymentTime)
    );
    expect(label).toMatch(/23.*jun.*2026/i);
    expect(label).toMatch(/7:44|07:44/i);
  });

  it('handles ISO API values without day shift', () => {
    const isoFixture = {
      paymentDate: '2026-06-23T00:00:00.000Z',
      paymentTime: '1970-01-01T07:44:00.000Z',
    };
    const label = formatPaymentDateTime(
      normalizePaymentDate(isoFixture.paymentDate),
      normalizePaymentTime(isoFixture.paymentTime)
    );
    expect(label).toMatch(/23.*jun.*2026/i);
    expect(label).toMatch(/7:44|07:44/i);
  });

  it('flags corrupted pipeline stages', () => {
    const corrupted = verifyPaymentDatePipeline({
      reference: apiFixture.reference,
      dbPaymentDate: '2026-06-23',
      dbPaymentTime: '07:44:00',
      apiPaymentDate: '2026-06-22',
      cachedPaymentDate: '2026-06-22',
    });
    expect(corrupted.ok).toBe(false);
    expect(corrupted.stages.some((stage) => stage.stage === 'mobile_cache' && !stage.ok)).toBe(
      true
    );
  });
});
