const mockGetJson = jest.fn();
const mockSetJson = jest.fn();

jest.mock('@/lib/storage/secure-storage-client', () => ({
  secureStorageClient: {
    getJson: (...args: unknown[]) => mockGetJson(...args),
    setJson: (...args: unknown[]) => mockSetJson(...args),
  },
}));

import { paymentRegisterCacheRepository } from '@/lib/services/payments/PaymentRegisterCacheRepository';

describe('PaymentRegisterCacheRepository.mergeRemoteEntries', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetJson.mockResolvedValue(null);
    mockSetJson.mockResolvedValue(undefined);
    await paymentRegisterCacheRepository.clearAll();
  });

  it('imports remote-only payments into local cache', async () => {
    const result = await paymentRegisterCacheRepository.mergeRemoteEntries([
      {
        id: '42',
        name: 'Juan Pérez',
        pago: '1500.00',
        mobile: '04141234567',
        ref: '999888777',
        paymentDate: '2026-06-17',
        paymentTime: '14:30',
        invoiceId: null,
        invoiceStatus: 'paid',
        notificationKey: null,
      },
    ]);

    expect(result).toEqual({ updated: 0, imported: 1 });

    const page = await paymentRegisterCacheRepository.listSlice(0, 10);
    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({
      remoteRegisterId: '42',
      name: 'Juan Pérez',
      pago: '1500.00',
      ref: '999888777',
      syncStatus: 'payment_confirmed',
      notificationKey: 'remote-42',
    });
  });

  it('updates an existing local entry matched by notification key', async () => {
    await paymentRegisterCacheRepository.upsert({
      name: 'Local',
      pago: '100.00',
      mobile: '04140000000',
      ref: '111',
      paymentDate: '2026-06-16',
      paymentTime: '10:00',
      notificationKey: 'bdv-key-1',
      notificationId: 'bdv-key-1',
      syncStatus: 'pending_sync',
    });

    const result = await paymentRegisterCacheRepository.mergeRemoteEntries([
      {
        id: '99',
        name: 'Remote Name',
        pago: '100.00',
        mobile: '04140000000',
        ref: '111',
        paymentDate: '2026-06-16',
        paymentTime: '10:00',
        invoiceId: null,
        invoiceStatus: 'paid',
        notificationKey: 'bdv-key-1',
      },
    ]);

    expect(result).toEqual({ updated: 1, imported: 0 });

    const page = await paymentRegisterCacheRepository.listSlice(0, 10);
    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({
      remoteRegisterId: '99',
      name: 'Remote Name',
      syncStatus: 'payment_confirmed',
    });
  });

  it('keeps locally parsed payment date/time when remote sync returns shifted values', async () => {
    await paymentRegisterCacheRepository.upsert({
      name: 'Local',
      pago: '4.96',
      mobile: '04141222392',
      ref: '061743996724',
      paymentDate: '2026-06-23',
      paymentTime: '07:44',
      notificationKey: 'bdv-key-shifted',
      notificationId: 'bdv-key-shifted',
      syncStatus: 'pending_sync',
    });

    await paymentRegisterCacheRepository.mergeRemoteEntries([
      {
        id: '15',
        name: null,
        pago: '4.96',
        mobile: '04141222392',
        ref: '061743996724',
        paymentDate: '2026-06-22',
        paymentTime: '07:44:00',
        invoiceId: null,
        invoiceStatus: 'paid',
        notificationKey: 'bdv-key-shifted',
      },
    ]);

    const page = await paymentRegisterCacheRepository.listSlice(0, 10);
    expect(page.items[0]).toMatchObject({
      paymentDate: '2026-06-23',
      paymentTime: '07:44',
      remoteRegisterId: '15',
    });
  });

  it('normalizes ISO payment dates imported from remote-only entries', async () => {
    await paymentRegisterCacheRepository.mergeRemoteEntries([
      {
        id: '50',
        name: 'Remote',
        pago: '10.00',
        mobile: '04141234567',
        ref: '123456',
        paymentDate: '2026-06-23T00:00:00.000Z',
        paymentTime: '1970-01-01T07:44:00.000Z',
        invoiceId: null,
        invoiceStatus: 'paid',
        notificationKey: null,
      },
    ]);

    const page = await paymentRegisterCacheRepository.listSlice(0, 10);
    expect(page.items[0]).toMatchObject({
      paymentDate: '2026-06-23',
      paymentTime: '07:44',
    });
  });
});
