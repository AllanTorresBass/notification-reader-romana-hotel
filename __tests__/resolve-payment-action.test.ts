import { resolvePaymentAction, getPaymentActionHint } from '@/lib/utils/resolve-payment-action';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

function makeEntry(
  overrides: Partial<PaymentRegisterCacheEntry> = {}
): PaymentRegisterCacheEntry {
  return {
    localId: 'local-1',
    remoteRegisterId: null,
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

describe('resolvePaymentAction', () => {
  it('suggests sync and confirm for unsynced failed payment with data', () => {
    const action = resolvePaymentAction(
      makeEntry({ syncStatus: 'sync_failed', remoteRegisterId: null, ref: '123', paymentDate: '2026-06-01' })
    );
    expect(action.kind).toBe('sync_and_confirm');
    expect(action.hint).toBe('Sincronizar y confirmar →');
  });

  it('suggests confirm when failed but already has remote id', () => {
    const action = resolvePaymentAction(
      makeEntry({ syncStatus: 'sync_failed', remoteRegisterId: '42', ref: '123', paymentDate: '2026-06-01' })
    );
    expect(action.kind).toBe('confirm_payment');
    expect(action.hint).toBe('Confirmar pago →');
  });

  it('suggests complete data when mobile is sin-leer', () => {
    const action = resolvePaymentAction(
      makeEntry({ syncStatus: 'sync_failed', mobile: 'sin-leer', ref: '123', paymentDate: '2026-06-01' })
    );
    expect(action.kind).toBe('complete_data');
  });

  it('suggests login when offline', () => {
    const action = resolvePaymentAction(makeEntry({ syncStatus: 'synced' }), { isAuthenticated: false });
    expect(action.kind).toBe('login_required');
  });
});

describe('getPaymentActionHint', () => {
  it('matches resolvePaymentAction hint', () => {
    const entry = makeEntry({ syncStatus: 'synced' });
    expect(getPaymentActionHint(entry)).toBe(resolvePaymentAction(entry).hint);
  });
});
