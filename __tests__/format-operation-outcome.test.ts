import { copy } from '@/constants/copy';
import {
  formatAssignClientOutcome,
  formatCaptureBatchOutcome,
  formatConfirmPaymentOutcome,
  formatCaptureNotificationOutcome,
  formatManualRegisterOutcome,
  formatPullSyncOutcome,
  formatQueueRetryOutcome,
  formatShadeSyncOutcome,
} from '@/lib/feedback/format-operation-outcome';
import type { PaymentRegisterCacheEntry } from '@/types/payment/payment-register-cache.types';

const baseEntry: PaymentRegisterCacheEntry = {
  localId: 'local-1',
  remoteRegisterId: null,
  remoteInvoiceId: null,
  invoiceStatus: null,
  syncStatus: 'pending_sync',
  lastSyncError: null,
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
};

describe('formatConfirmPaymentOutcome', () => {
  it('returns queued message when offline', () => {
    const outcome = formatConfirmPaymentOutcome({ entry: baseEntry, status: 'queued' });
    expect(outcome.status).toBe('queued');
    expect(outcome.title).toBe(copy.pagos.actions.confirm.queuedTitle);
    expect(outcome.message).toContain('Bs.');
  });

  it('returns completed message on server success', () => {
    const outcome = formatConfirmPaymentOutcome({ entry: baseEntry, status: 'completed' });
    expect(outcome.status).toBe('completed');
    expect(outcome.title).toBe('Pago confirmado');
    expect(outcome.message).toContain('factura quedó marcada como pagada');
  });

  it('returns skipped when already done', () => {
    const outcome = formatConfirmPaymentOutcome({ entry: baseEntry, status: 'already_done' });
    expect(outcome.status).toBe('skipped');
    expect(outcome.title).toBe(copy.pagos.actions.confirm.alreadyTitle);
  });
});

describe('formatAssignClientOutcome', () => {
  it('returns queued message when offline', () => {
    const outcome = formatAssignClientOutcome({ entry: baseEntry, status: 'queued' }, 'Ana López');
    expect(outcome.status).toBe('queued');
    expect(outcome.title).toBe(copy.pagos.actions.assign.queuedTitle);
    expect(outcome.message).toContain('Ana López');
  });

  it('returns completed on success', () => {
    const outcome = formatAssignClientOutcome(
      { entry: baseEntry, status: 'completed' },
      'Ana López'
    );
    expect(outcome.status).toBe('completed');
    expect(outcome.title).toBe('Cliente asociado');
    expect(outcome.message).toContain('Ana López');
  });
});

describe('formatManualRegisterOutcome', () => {
  it('distinguishes queued vs completed', () => {
    expect(formatManualRegisterOutcome('queued').title).toBe(
      copy.feedback.payment.manualQueuedTitle
    );
    expect(formatManualRegisterOutcome('completed').title).toBe(
      copy.feedback.payment.manualCompletedTitle
    );
  });
});

describe('formatCaptureNotificationOutcome', () => {
  it('returns null when no entry', () => {
    expect(
      formatCaptureNotificationOutcome({
        entry: null,
        created: false,
        duplicate: false,
        parseFailed: false,
        partialParse: false,
      })
    ).toBeNull();
  });

  it('returns skipped for duplicate', () => {
    const outcome = formatCaptureNotificationOutcome({
      entry: baseEntry,
      created: false,
      duplicate: true,
      parseFailed: false,
      partialParse: false,
    });
    expect(outcome?.status).toBe('skipped');
    expect(outcome?.title).toBe(copy.feedback.capture.duplicateTitle);
  });

  it('returns partial for parse failure', () => {
    const outcome = formatCaptureNotificationOutcome({
      entry: baseEntry,
      created: true,
      duplicate: false,
      parseFailed: true,
      partialParse: false,
    });
    expect(outcome?.status).toBe('partial');
    expect(outcome?.title).toBe(copy.feedback.capture.parseFailedTitle);
  });

  it('returns completed for new capture', () => {
    const outcome = formatCaptureNotificationOutcome({
      entry: baseEntry,
      created: true,
      duplicate: false,
      parseFailed: false,
      partialParse: false,
    });
    expect(outcome?.status).toBe('completed');
    expect(outcome?.title).toBe(copy.feedback.capture.completedTitle);
    expect(outcome?.message).toContain('Bs.');
  });
});

describe('formatCaptureBatchOutcome', () => {
  it('uses batch copy for multiple captures', () => {
    const outcome = formatCaptureBatchOutcome(3);
    expect(outcome.title).toBe(copy.feedback.capture.batchTitle);
    expect(outcome.message).toContain('3');
  });
});

describe('formatPullSyncOutcome', () => {
  it('returns failed on error', () => {
    const outcome = formatPullSyncOutcome({
      reason: 'manual',
      authenticated: true,
      created: 0,
      enqueued: 0,
      pendingJobs: 1,
      pulled: false,
      durationMs: 100,
      errorCode: 'network',
      errorMessage: 'Sin conexión',
    });
    expect(outcome.status).toBe('failed');
    expect(outcome.title).toBe(copy.feedback.sync.failedTitle);
  });

  it('returns skipped when sync in flight', () => {
    const outcome = formatPullSyncOutcome({
      reason: 'manual',
      authenticated: true,
      created: 0,
      enqueued: 0,
      pendingJobs: 0,
      pulled: false,
      durationMs: 0,
      errorCode: null,
      errorMessage: null,
    });
    expect(outcome.status).toBe('skipped');
    expect(outcome.title).toBe(copy.feedback.sync.inFlightTitle);
  });

  it('returns completed with summary', () => {
    const outcome = formatPullSyncOutcome({
      reason: 'manual',
      authenticated: true,
      created: 2,
      enqueued: 0,
      pendingJobs: 0,
      pulled: true,
      durationMs: 500,
      errorCode: null,
      errorMessage: null,
    });
    expect(outcome.status).toBe('completed');
    expect(outcome.message).toContain('2 pagos nuevos importados');
    expect(outcome.message).toContain('Datos actualizados desde kd-gym.');
  });
});

describe('formatShadeSyncOutcome', () => {
  it('returns failed when listener disconnected', () => {
    const outcome = formatShadeSyncOutcome({ scanned: 0, ingested: 0, listenerConnected: false });
    expect(outcome.status).toBe('failed');
    expect(outcome.title).toBe(copy.feedback.notifications.serviceDownTitle);
  });

  it('returns skipped when no notifications', () => {
    const outcome = formatShadeSyncOutcome({ scanned: 0, ingested: 0, listenerConnected: true });
    expect(outcome.status).toBe('skipped');
    expect(outcome.title).toBe(copy.feedback.notifications.emptyTitle);
  });

  it('returns completed when ingested', () => {
    const outcome = formatShadeSyncOutcome({ scanned: 3, ingested: 2, listenerConnected: true });
    expect(outcome.status).toBe('completed');
    expect(outcome.title).toBe(copy.feedback.notifications.importedTitle);
    expect(outcome.message).toContain('3 alertas BDV');
    expect(outcome.message).toContain('2 notificaciones nuevas');
  });
});

describe('formatQueueRetryOutcome', () => {
  it('returns partial when some failed', () => {
    const outcome = formatQueueRetryOutcome({ processed: 2, failed: 1, pendingJobs: 1 });
    expect(outcome.status).toBe('partial');
    expect(outcome.title).toBe(copy.feedback.queue.partialTitle);
  });

  it('returns skipped when nothing to retry', () => {
    const outcome = formatQueueRetryOutcome({ processed: 0, failed: 0, pendingJobs: 0 });
    expect(outcome.status).toBe('skipped');
    expect(outcome.title).toBe(copy.feedback.queue.emptyTitle);
  });

  it('returns completed on success', () => {
    const outcome = formatQueueRetryOutcome({ processed: 3, failed: 0, pendingJobs: 0 });
    expect(outcome.status).toBe('completed');
    expect(outcome.title).toBe(copy.feedback.queue.completedTitle);
  });
});
