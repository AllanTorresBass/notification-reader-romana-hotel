import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

const mockListSlice = jest.fn();

jest.mock('@/lib/services/payments/PaymentRegisterCacheRepository', () => ({
  paymentRegisterCacheRepository: {
    listSlice: (...args: unknown[]) => mockListSlice(...args),
  },
}));

import {
  findLocalRegisterByInvoiceId,
  findLocalRegisterByReference,
} from '@/lib/invoices/find-local-register-for-invoice';

function entry(
  overrides: Partial<PaymentRegisterCacheEntry>
): PaymentRegisterCacheEntry {
  return {
    localId: 'local-1',
    remoteRegisterId: 'remote-1',
    remoteInvoiceId: null,
    invoiceStatus: null,
    syncStatus: 'synced',
    lastSyncError: null,
    assignedClientId: null,
    assignedClientName: null,
    name: null,
    pago: '15000.00',
    mobile: '0412-1222392',
    ref: '222917745208',
    paymentDate: '2026-06-02',
    paymentTime: '22:29',
    notificationKey: 'key-1',
    notificationId: 'notif-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('find-local-register-for-invoice', () => {
  beforeEach(() => {
    mockListSlice.mockReset();
  });

  it('finds register by invoice id', async () => {
    mockListSlice.mockResolvedValue({
      items: [entry({ remoteInvoiceId: 'invoice-abc' })],
      nextOffset: null,
    });

    const result = await findLocalRegisterByInvoiceId('invoice-abc');
    expect(result?.localId).toBe('local-1');
  });

  it('finds register by last four digits', async () => {
    mockListSlice.mockResolvedValue({
      items: [entry({ ref: '2229-1774-5208' })],
      nextOffset: null,
    });

    expect((await findLocalRegisterByReference('5208'))?.ref).toBe('2229-1774-5208');
    expect((await findLocalRegisterByReference('222917745208'))?.ref).toBe('2229-1774-5208');
  });

  it('returns null when no match', async () => {
    mockListSlice.mockResolvedValue({ items: [], nextOffset: null });
    expect(await findLocalRegisterByReference('5209')).toBeNull();
  });
});
