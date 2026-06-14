import {
  inferInvoiceSearchMode,
  normalizePaymentReference,
  paymentReferenceSuffix,
  paymentReferencesMatch,
} from '@/types/invoice/invoice-search.types';

describe('invoice search helpers', () => {
  it('normalizes payment references', () => {
    expect(normalizePaymentReference('2229-1774-5208')).toBe('222917745208');
  });

  it('uses reference mode for 4+ digits', () => {
    expect(inferInvoiceSearchMode('5208')).toBe('reference');
    expect(inferInvoiceSearchMode('222917745208')).toBe('reference');
    expect(inferInvoiceSearchMode('222')).toBe('general');
  });

  it('matches by last four digits', () => {
    expect(paymentReferenceSuffix('222917745208')).toBe('5208');
    expect(paymentReferenceSuffix('5208')).toBe('5208');
    expect(paymentReferencesMatch('5208', '2229-1774-5208')).toBe(true);
    expect(paymentReferencesMatch('222917745208', '222917745208')).toBe(true);
    expect(paymentReferencesMatch('5209', '222917745208')).toBe(false);
  });

  it('uses reference mode for dashed refs', () => {
    expect(inferInvoiceSearchMode('2229-1774-5208')).toBe('reference');
  });
});
