import type { NotificationRecord } from '@/types/notification/notification.types';

const mockUpsert = jest.fn();
const mockGetByNotificationKey = jest.fn();
const mockEnqueue = jest.fn();
const mockListSlice = jest.fn();
const mockGetAllValidated = jest.fn();

jest.mock('@/lib/services/payments/PaymentRegisterCacheRepository', () => ({
  paymentRegisterCacheRepository: {
    upsert: (...args: unknown[]) => mockUpsert(...args),
    getByNotificationKey: (...args: unknown[]) => mockGetByNotificationKey(...args),
    listSlice: (...args: unknown[]) => mockListSlice(...args),
  },
}));

jest.mock('@/lib/services/sync/payment-sync-queue', () => ({
  paymentSyncQueue: {
    enqueue: (...args: unknown[]) => mockEnqueue(...args),
  },
}));

jest.mock('@/lib/services/notifications/NotificationRepository', () => ({
  notificationRepository: {
    getAllValidated: (...args: unknown[]) => mockGetAllValidated(...args),
  },
}));

jest.mock('@/stores/api-auth-store', () => ({
  useApiAuthStore: { getState: () => ({ isAuthenticated: () => false }) },
}));

jest.mock('@/stores/api-config-store', () => ({
  useApiConfigStore: { getState: () => ({ setLastSyncAt: jest.fn() }) },
}));

jest.mock('@/lib/feedback/sync-job-feedback', () => ({
  reportSyncJobFailure: jest.fn(),
}));

import { paymentRegisterService } from '@/lib/services/payments/PaymentRegisterService';

const BDV_NOTIFICATION: NotificationRecord = {
  id: 'notif-1',
  packageName: 'com.bancodevenezuela.bdvdigital',
  appLabel: 'BDV',
  title: 'PagomovilBDV recibido',
  body: 'Recibiste un PagomovilBDV por Bs.15.000,00 del 0412-1222392 Ref: 222917745208 en fecha 02-06-26 hora: 22:29.',
  bigText:
    'Recibiste un PagomovilBDV por Bs.15.000,00 del 0412-1222392 Ref: 222917745208 en fecha 02-06-26 hora: 22:29.',
  postTime: 1_700_000_000_000,
  notificationKey: 'bdv-key-1',
  groupKey: null,
  isGroupSummary: false,
  isRedacted: false,
  isOngoing: false,
  dismissedAt: null,
  rawPayloadJson: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('PaymentRegisterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetByNotificationKey.mockResolvedValue(null);
    mockUpsert.mockImplementation(async (input) => ({
      localId: 'local-1',
      remoteRegisterId: null,
      remoteInvoiceId: null,
      invoiceStatus: null,
      syncStatus: input.syncStatus ?? 'pending_sync',
      lastSyncError: input.lastSyncError ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input,
    }));
    mockEnqueue.mockResolvedValue({ id: 'job-1' });
    mockListSlice.mockResolvedValue({ items: [], nextOffset: null, total: 0 });
    mockGetAllValidated.mockResolvedValue([]);
  });

  it('creates a local payment register from a Pagomóvil notification', async () => {
    const result = await paymentRegisterService.ingestFromNotification(BDV_NOTIFICATION);

    expect(result.entry).not.toBeNull();
    expect(result.created).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pago: '15000.00',
        mobile: '0412-1222392',
        ref: '222917745208',
        paymentDate: '2026-06-02',
        paymentTime: '22:29',
        dateSource: 'notification_text',
        syncStatus: 'pending_sync',
      })
    );
    expect(mockEnqueue).toHaveBeenCalledWith('create_register', 'local-1');
  });

  it('skips ingest when the register already exists remotely', async () => {
    mockGetByNotificationKey.mockResolvedValue({
      localId: 'local-existing',
      remoteRegisterId: 'remote-1',
      pago: '15000.00',
      mobile: '0412-1222392',
    });

    const result = await paymentRegisterService.ingestFromNotification(BDV_NOTIFICATION);

    expect(result.entry?.remoteRegisterId).toBe('remote-1');
    expect(result.duplicate).toBe(true);
    expect(result.created).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('re-enqueues pending local registers during syncPendingRegisters', async () => {
    mockListSlice.mockResolvedValue({
      items: [
        {
          localId: 'local-pending',
          remoteRegisterId: null,
          pago: '15000.00',
          mobile: '0412-1222392',
        },
      ],
      nextOffset: null,
      total: 1,
    });

    const enqueued = await paymentRegisterService.syncPendingRegisters();

    expect(enqueued).toBe(1);
    expect(mockEnqueue).toHaveBeenCalledWith('create_register', 'local-pending');
  });
});
