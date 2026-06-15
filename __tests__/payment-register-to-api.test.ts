import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';
import {
  cacheEntryToConfirmedCreateInput,
  cacheEntryToCreatePaymentInput,
  cacheEntryToUpdatePaymentInput,
} from '@/lib/utils/payment-register-to-api';

const baseEntry: PaymentRegisterCacheEntry = {
  localId: 'local-1',
  remoteRegisterId: null,
  remoteInvoiceId: null,
  name: 'Juan Perez',
  pago: '15000.00',
  mobile: '0412-1222392',
  ref: '222917745208',
  paymentDate: '2026-06-02',
  paymentTime: '22:29',
  notificationKey: 'com.bancodevenezuela.bdvdigital::bdv-key-1',
  notificationId: 'notif-1',
  invoiceStatus: null,
  syncStatus: 'pending_sync',
  lastSyncError: null,
  failureClass: null,
  failureStage: null,
    createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

describe('payment-register-to-api', () => {
  it('maps a complete cache entry to create payment input', () => {
    const input = cacheEntryToCreatePaymentInput(baseEntry);

    expect(input).toEqual({
      reference: '222917745208',
      amount: '15000.00',
      payerName: 'Juan Perez',
      payerPhone: '0412-1222392',
      bank: 'Banco de Venezuela',
      status: 'confirmado',
      paymentDate: '2026-06-02',
      paymentTime: '22:29',
      notificationKey: 'com.bancodevenezuela.bdvdigital::bdv-key-1',
      source: 'mobile',
    });
  });

  it('uses pendiente status when reference is missing', () => {
    const input = cacheEntryToCreatePaymentInput({
      ...baseEntry,
      ref: '',
      paymentDate: '',
      paymentTime: '',
    });

    expect(input.status).toBe('pendiente');
    expect(input.reference.startsWith('NK-')).toBe(true);
  });

  it('maps update input to confirmado', () => {
    const input = cacheEntryToUpdatePaymentInput(baseEntry);
    expect(input.status).toBe('confirmado');
    expect(input.reference).toBe('222917745208');
  });

  it('omits sin-leer phone from API payload', () => {
    const input = cacheEntryToCreatePaymentInput({
      ...baseEntry,
      mobile: 'sin-leer',
    });
    expect(input.payerPhone).toBeUndefined();
  });

  it('builds confirmed create input for unsynced confirm flow', () => {
    const input = cacheEntryToConfirmedCreateInput(baseEntry);
    expect(input.status).toBe('confirmado');
    expect(input.notificationKey).toBe(baseEntry.notificationKey);
  });

  it('omits null payerName from API payload', () => {
    const input = cacheEntryToConfirmedCreateInput({ ...baseEntry, name: null });
    expect(input.payerName).toBeUndefined();
    expect(JSON.stringify(input)).not.toContain('null');
  });

  it('normalizes Venezuelan amount formats for API', () => {
    expect(
      cacheEntryToConfirmedCreateInput({ ...baseEntry, pago: '15.000,00' }).amount
    ).toBe('15000.00');
    expect(cacheEntryToConfirmedCreateInput({ ...baseEntry, pago: '2,00' }).amount).toBe('2.00');
  });
});
