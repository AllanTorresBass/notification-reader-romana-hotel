const mockReprocess = jest.fn();
const mockSyncPending = jest.fn();
const mockProcessQueue = jest.fn();
const mockPullRemote = jest.fn();
const mockPingMe = jest.fn();
const mockGetPendingCount = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockExpireIfNeeded = jest.fn();
const mockSetLastSyncError = jest.fn();

jest.mock('@/lib/storage/wait-for-persist-hydration', () => ({
  waitForApiStoresHydration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/services/payments/PaymentRegisterService', () => ({
  paymentRegisterService: {
    reprocessStoredNotifications: (...args: unknown[]) => mockReprocess(...args),
    syncPendingRegisters: (...args: unknown[]) => mockSyncPending(...args),
    processQueue: (...args: unknown[]) => mockProcessQueue(...args),
    pullRemote: (...args: unknown[]) => mockPullRemote(...args),
  },
}));

jest.mock('@/lib/api-client/auth/AuthApiService', () => ({
  authApiService: {
    pingMe: (...args: unknown[]) => mockPingMe(...args),
  },
}));

jest.mock('@/lib/services/sync/payment-sync-queue', () => ({
  paymentSyncQueue: {
    getPendingCount: (...args: unknown[]) => mockGetPendingCount(...args),
  },
}));

jest.mock('@/stores/api-auth-store', () => ({
  useApiAuthStore: {
    getState: () => ({
      isAuthenticated: mockIsAuthenticated,
      expireIfNeeded: mockExpireIfNeeded,
      setLastSyncError: mockSetLastSyncError,
      accessToken: 'token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: null,
      lastSyncError: null,
    }),
  },
}));

jest.mock('@/stores/api-config-store', () => ({
  useApiConfigStore: {
    getState: () => ({ baseUrl: 'https://la-romana-hotel.vercel.app', setLastSyncAt: jest.fn() }),
  },
}));

jest.mock('@/lib/feedback/report-service-error', () => ({
  reportServiceError: jest.fn(),
}));

import { paymentSyncOrchestrator, resetPaymentSyncOrchestratorForTests } from '@/lib/services/payments/PaymentSyncOrchestrator';

describe('PaymentSyncOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPaymentSyncOrchestratorForTests();
    mockReprocess.mockResolvedValue(2);
    mockSyncPending.mockResolvedValue(1);
    mockProcessQueue.mockResolvedValue(undefined);
    mockPullRemote.mockResolvedValue(undefined);
    mockPingMe.mockResolvedValue({ id: 'user-1' });
    mockGetPendingCount.mockResolvedValue(0);
    mockExpireIfNeeded.mockReturnValue(false);
  });

  it('skips remote sync when unauthenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    const result = await paymentSyncOrchestrator.runSync('startup');

    expect(result.authenticated).toBe(false);
    expect(result.created).toBe(2);
    expect(mockSyncPending).not.toHaveBeenCalled();
    expect(mockPullRemote).not.toHaveBeenCalled();
  });

  it('runs full remote pipeline when authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(true);

    const result = await paymentSyncOrchestrator.runSync('login');

    expect(result.authenticated).toBe(true);
    expect(result.pulled).toBe(true);
    expect(mockPingMe).toHaveBeenCalled();
    expect(mockSyncPending).toHaveBeenCalled();
    expect(mockProcessQueue).toHaveBeenCalled();
    expect(mockPullRemote).toHaveBeenCalled();
  });

  it('returns auth error when ping fails', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockPingMe.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));

    const result = await paymentSyncOrchestrator.runSync('manual');

    expect(result.errorMessage).toBeTruthy();
    expect(mockPullRemote).not.toHaveBeenCalled();
  });

  it('runs remote sync for notification reason without throttle', async () => {
    mockIsAuthenticated.mockReturnValue(true);

    await paymentSyncOrchestrator.runSync('startup');
    jest.clearAllMocks();
    mockReprocess.mockResolvedValue(0);
    mockSyncPending.mockResolvedValue(0);
    mockGetPendingCount.mockResolvedValue(0);

    const result = await paymentSyncOrchestrator.runSync('notification');

    expect(result.pulled).toBe(true);
    expect(mockPullRemote).toHaveBeenCalled();
  });

  it('waits for in-flight sync when manual refresh is requested', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    let resolveFirst!: (value: unknown) => void;
    const firstPull = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    mockPullRemote.mockImplementationOnce(() => firstPull);

    const first = paymentSyncOrchestrator.runSync('startup');
    const second = paymentSyncOrchestrator.runSync('manual');

    resolveFirst(undefined);
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult.pulled).toBe(true);
    expect(secondResult.pulled).toBe(true);
    expect(mockPullRemote).toHaveBeenCalledTimes(2);
  });
});
