import {
  canAssignClientToPayment,
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

  it('never downgrades client_assigned', () => {
    expect(mergeSyncStatus('client_assigned', 'pending')).toBe('client_assigned');
    expect(mergeSyncStatus('client_assigned', 'paid')).toBe('client_assigned');
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

describe('canAssignClientToPayment', () => {
  it('allows assign when payment is confirmed locally or invoice is paid', () => {
    expect(canAssignClientToPayment({ syncStatus: 'payment_confirmed', invoiceStatus: null })).toBe(
      true
    );
    expect(canAssignClientToPayment({ syncStatus: 'synced', invoiceStatus: 'paid' })).toBe(true);
  });

  it('blocks assign after client is linked', () => {
    expect(
      canAssignClientToPayment({ syncStatus: 'client_assigned', invoiceStatus: 'paid' })
    ).toBe(false);
  });

  it('blocks assign before payment is confirmed', () => {
    expect(canAssignClientToPayment({ syncStatus: 'synced', invoiceStatus: 'pending' })).toBe(
      false
    );
  });
});
