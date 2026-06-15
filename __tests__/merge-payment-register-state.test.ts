import {
  isPaymentWorkflowComplete,
  mergeInvoiceStatus,
  mergeSyncStatus,
} from '@/lib/utils/merge-payment-register-state';

describe('mergeInvoiceStatus', () => {
  it('keeps paid when either side is paid', () => {
    expect(mergeInvoiceStatus('paid', 'pending')).toBe('paid');
    expect(mergeInvoiceStatus('pending', 'paid')).toBe('paid');
    expect(mergeInvoiceStatus('paid', null)).toBe('paid');
  });

  it('falls back to pending when neither side is paid', () => {
    expect(mergeInvoiceStatus('pending', null)).toBe('pending');
    expect(mergeInvoiceStatus(null, 'pending')).toBe('pending');
  });
});

describe('mergeSyncStatus', () => {
  it('never downgrades payment_confirmed when remote invoice is still pending', () => {
    expect(mergeSyncStatus('payment_confirmed', 'pending')).toBe('payment_confirmed');
    expect(mergeSyncStatus('payment_confirmed', null)).toBe('payment_confirmed');
  });

  it('promotes synced to payment_confirmed when remote invoice is paid', () => {
    expect(mergeSyncStatus('synced', 'paid')).toBe('payment_confirmed');
  });

  it('promotes pending_sync to payment_confirmed when remote invoice is paid', () => {
    expect(mergeSyncStatus('pending_sync', 'paid')).toBe('payment_confirmed');
  });

  it('recovers sync_failed when remote confirms paid', () => {
    expect(mergeSyncStatus('sync_failed', 'paid')).toBe('payment_confirmed');
  });
});

describe('isPaymentWorkflowComplete', () => {
  it('returns true when payment is confirmed locally or invoice is paid', () => {
    expect(isPaymentWorkflowComplete({ syncStatus: 'payment_confirmed', invoiceStatus: null })).toBe(
      true
    );
    expect(isPaymentWorkflowComplete({ syncStatus: 'synced', invoiceStatus: 'paid' })).toBe(true);
  });

  it('returns false before payment is confirmed', () => {
    expect(isPaymentWorkflowComplete({ syncStatus: 'synced', invoiceStatus: 'pending' })).toBe(false);
    expect(isPaymentWorkflowComplete({ syncStatus: 'pending_sync', invoiceStatus: null })).toBe(false);
  });
});
