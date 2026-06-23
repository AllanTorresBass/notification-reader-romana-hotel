import {
  formatSessionExpiredOutcome,
  formatStorageFailureOutcome,
  formatSyncJobFailedOutcome,
} from '@/lib/feedback/format-operation-outcome';
import { copy } from '@/constants/copy';
import {
  resetReportDedupeForTests,
  shouldSkipDuplicateReport,
} from '@/lib/feedback/report-dedupe';
import { trimActivityLogEntries, type StoredActivityLogEntry } from '@/stores/activity-log-store';
import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

function shouldReportShadeSyncOutcome(result: {
  scanned: number;
  ingested: number;
  stored?: number;
  listenerConnected: boolean;
  accessGranted: boolean;
}): boolean {
  if ((result.stored ?? 0) > 0 || result.ingested > 0) return true;
  if (!result.accessGranted) return true;
  if (!result.listenerConnected && result.scanned === 0) return false;
  if (result.scanned > 0) return true;
  return false;
}

function entry(status: OperationOutcome['status'], id: string): StoredActivityLogEntry {
  return {
    id,
    timestamp: Number(id),
    synced: false,
    remoteId: null,
    outcome: {
      kind: 'pull_sync',
      status,
      title: id,
      message: id,
    },
  };
}

describe('shouldSkipDuplicateReport', () => {
  beforeEach(() => {
    resetReportDedupeForTests();
  });

  it('dedupes repeated failed reports within ttl', () => {
    expect(shouldSkipDuplicateReport('pull_sync', 'Sin conexión', 'failed')).toBe(false);
    expect(shouldSkipDuplicateReport('pull_sync', 'Sin conexión', 'failed')).toBe(true);
  });

  it('does not dedupe completed reports', () => {
    expect(shouldSkipDuplicateReport('pull_sync', 'OK', 'completed')).toBe(false);
    expect(shouldSkipDuplicateReport('pull_sync', 'OK', 'completed')).toBe(false);
  });
});

describe('shouldReportShadeSyncOutcome', () => {
  it('reports when notification access is not granted', () => {
    expect(
      shouldReportShadeSyncOutcome({
        scanned: 0,
        ingested: 0,
        listenerConnected: false,
        accessGranted: false,
      })
    ).toBe(true);
  });

  it('skips transient listener warmup when access is granted', () => {
    expect(
      shouldReportShadeSyncOutcome({
        scanned: 0,
        ingested: 0,
        listenerConnected: false,
        accessGranted: true,
      })
    ).toBe(false);
  });

  it('skips when listener is connected and nothing scanned', () => {
    expect(
      shouldReportShadeSyncOutcome({
        scanned: 0,
        ingested: 0,
        listenerConnected: true,
        accessGranted: true,
      })
    ).toBe(false);
  });
});

describe('trimActivityLogEntries', () => {
  it('keeps failed entries when trimming', () => {
    const failed = Array.from({ length: 120 }, (_, i) => entry('failed', String(i + 1000)));
    const completed = Array.from({ length: 120 }, (_, i) => entry('completed', String(i)));
    const trimmed = trimActivityLogEntries([...failed, ...completed]);
    expect(trimmed.length).toBeLessThanOrEqual(200);
    expect(trimmed.some((item) => item.outcome.status === 'failed')).toBe(true);
  });
});

describe('infra formatters', () => {
  it('formats session expired outcome', () => {
    const outcome = formatSessionExpiredOutcome();
    expect(outcome.kind).toBe('session_expired');
    expect(outcome.status).toBe('failed');
    expect(outcome.title).toBe(copy.feedback.infra.sessionExpiredTitle);
  });

  it('formats storage failure outcome', () => {
    const outcome = formatStorageFailureOutcome();
    expect(outcome.kind).toBe('storage_failure');
    expect(outcome.title).toBe(copy.feedback.infra.storageFailureTitle);
  });

  it('formats sync job failed outcome', () => {
    const outcome = formatSyncJobFailedOutcome('No se pudo confirmar.', 'confirm_payment');
    expect(outcome.kind).toBe('sync_job_failed');
    expect(outcome.meta?.jobType).toBe('confirm_payment');
  });
});
