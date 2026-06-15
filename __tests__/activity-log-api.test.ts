import { localEntryToCreateRequest } from '@/types/feedback/activity-log-api.types';
import type { OperationKind } from '@/types/feedback/operation-outcome.types';

const MOBILE_KINDS: OperationKind[] = [
  'capture_notification',
  'shade_sync',
  'manual_register',
  'confirm_payment',
  'pull_sync',
  'queue_retry',
  'login',
  'logout',
  'test_connection',
  'clear_cache',
  'clear_history',
  'rescan_bdv',
  'background_sync',
  'list_fetch',
  'notification_list_fetch',
  'purge_retention',
  'access_check',
  'onboarding_skip',
  'session_expired',
  'storage_failure',
  'listener_bridge_failure',
  'activity_log_sync',
  'sync_job_failed',
  'unhandled_exception',
];

describe('localEntryToCreateRequest', () => {
  it('sanitizes meta to primitive values only', () => {
    const request = localEntryToCreateRequest({
      id: '1717756800000-abc123',
      timestamp: 1_717_756_800_000,
      outcome: {
        kind: 'pull_sync',
        status: 'failed',
        title: 'Sync fallida',
        message: 'Sin conexión',
        meta: {
          syncRunId: 'run-1',
          nested: { bad: true } as unknown as string,
          empty: undefined as unknown as string,
        },
      },
    });

    expect(request.meta).toEqual({ syncRunId: 'run-1' });
  });

  it('truncates long title and message for server validation', () => {
    const request = localEntryToCreateRequest({
      id: '1717756800000-abc123',
      timestamp: 1_717_756_800_000,
      outcome: {
        kind: 'pull_sync',
        status: 'failed',
        title: 'x'.repeat(250),
        message: 'y'.repeat(2500),
      },
    });

    expect(request.title).toHaveLength(200);
    expect(request.message).toHaveLength(2000);
  });

  it('covers every mobile operation kind in the upload payload', () => {
    for (const kind of MOBILE_KINDS) {
      const request = localEntryToCreateRequest({
        id: '1717756800000-abc123',
        timestamp: 1_717_756_800_000,
        outcome: {
          kind,
          status: 'completed',
          title: 'Actividad',
          message: 'Detalle',
        },
      });

      expect(request.kind).toBe(kind);
    }
  });
});
