import {
  canConfirmPayment,
  filterPaymentRegisters,
  getPaymentActionHint,
  getPaymentFilterCounts,
} from '@/lib/utils/filter-payment-registers';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function makeEntry(
  overrides: Partial<PaymentRegisterCacheEntry> = {}
): PaymentRegisterCacheEntry {
  return {
    localId: 'local-1',
    remoteRegisterId: 'remote-1',
    remoteInvoiceId: null,
    name: 'Juan Pérez',
    pago: '15000.00',
    mobile: '04141234567',
    ref: '123456',
    paymentDate: '2026-06-01',
    paymentTime: '10:30',
    notificationKey: 'key-1',
    notificationId: 'notif-1',
    invoiceStatus: null,
    syncStatus: 'synced',
    assignedClientId: null,
    assignedClientName: null,
    lastSyncError: null,
    failureClass: null,
    failureStage: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('filterPaymentRegisters', () => {
  const entries = [
    makeEntry({ localId: '1', syncStatus: 'synced', ref: '111', paymentDate: '2026-06-01' }),
    makeEntry({
      localId: '2',
      syncStatus: 'payment_confirmed',
      invoiceStatus: 'paid',
      ref: '222',
      paymentDate: '2026-06-02',
    }),
    makeEntry({ localId: '3', syncStatus: 'client_assigned', assignedClientId: 'c1', assignedClientName: 'Ana' }),
    makeEntry({ localId: '4', syncStatus: 'pending_sync' }),
    makeEntry({ localId: '5', syncStatus: 'sync_failed', ref: '', paymentDate: '' }),
    makeEntry({ localId: '6', mobile: '04249876543', pago: '25000.00' }),
  ];

  it('returns all entries when filter is all', () => {
    expect(filterPaymentRegisters(entries, { status: 'all' })).toHaveLength(6);
  });

  it('filters needs_action entries', () => {
    const result = filterPaymentRegisters(entries, { status: 'needs_action' });
    const ids = result.map((e) => e.localId);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
    expect(ids).toContain('4');
    expect(ids).toContain('6');
    expect(ids).not.toContain('3');
    expect(ids).not.toContain('5');
  });

  it('filters pending_sync', () => {
    const result = filterPaymentRegisters(entries, { status: 'pending_sync' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('4');
  });

  it('filters sync_failed', () => {
    const result = filterPaymentRegisters(entries, { status: 'sync_failed' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('5');
  });

  it('filters awaiting_assign', () => {
    const result = filterPaymentRegisters(entries, { status: 'awaiting_assign' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('2');
  });

  it('filters completed', () => {
    const result = filterPaymentRegisters(entries, { status: 'completed' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('3');
  });

  it('searches by mobile', () => {
    const result = filterPaymentRegisters(entries, { status: 'all', search: '0424' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('6');
  });

  it('searches by pago amount', () => {
    const result = filterPaymentRegisters(entries, { status: 'all', search: '25000' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('6');
  });

  it('searches by assigned client name', () => {
    const result = filterPaymentRegisters(entries, { status: 'all', search: 'ana' });
    expect(result).toHaveLength(1);
    expect(result[0].localId).toBe('3');
  });

  it('returns empty for non-matching search', () => {
    expect(filterPaymentRegisters(entries, { search: 'zzzzz' })).toHaveLength(0);
  });

  it('ignores empty search', () => {
    expect(filterPaymentRegisters(entries, { search: '   ' })).toHaveLength(6);
  });
});

describe('getPaymentFilterCounts', () => {
  it('counts all filter buckets', () => {
    const entries = [
      makeEntry({ syncStatus: 'synced', ref: '1', paymentDate: '2026-06-01' }),
      makeEntry({ syncStatus: 'payment_confirmed', invoiceStatus: 'paid' }),
      makeEntry({ syncStatus: 'client_assigned' }),
      makeEntry({ syncStatus: 'pending_sync' }),
      makeEntry({ syncStatus: 'sync_failed' }),
    ];
    const counts = getPaymentFilterCounts(entries);
    expect(counts.all).toBe(5);
    expect(counts.needs_action).toBe(4);
    expect(counts.pending_sync).toBe(1);
    expect(counts.sync_failed).toBe(1);
    expect(counts.awaiting_assign).toBe(1);
    expect(counts.completed).toBe(1);
  });
});

describe('canConfirmPayment', () => {
  it('returns true when synced with ref and date', () => {
    expect(canConfirmPayment(makeEntry({ syncStatus: 'synced' }))).toBe(true);
  });

  it('returns false when already confirmed', () => {
    expect(canConfirmPayment(makeEntry({ syncStatus: 'payment_confirmed' }))).toBe(false);
  });

  it('returns false when ref missing', () => {
    expect(canConfirmPayment(makeEntry({ ref: '' }))).toBe(false);
  });
});

describe('getPaymentActionHint', () => {
  it('suggests confirm when eligible', () => {
    expect(getPaymentActionHint(makeEntry({ syncStatus: 'synced' }))).toBe('Confirmar pago →');
  });

  it('suggests assign when confirmed', () => {
    expect(
      getPaymentActionHint(makeEntry({ syncStatus: 'payment_confirmed', invoiceStatus: 'paid' }))
    ).toBe('Asociar cliente →');
  });

  it('suggests complete data on failed parse', () => {
    expect(
      getPaymentActionHint(makeEntry({ syncStatus: 'sync_failed', ref: '', paymentDate: '' }))
    ).toBe('Completar datos →');
  });

  it('suggests sync and confirm when failed with complete data', () => {
    expect(
      getPaymentActionHint(
        makeEntry({ syncStatus: 'sync_failed', remoteRegisterId: null, ref: '123', paymentDate: '2026-06-01' })
      )
    ).toBe('Sincronizar y confirmar →');
  });
});
