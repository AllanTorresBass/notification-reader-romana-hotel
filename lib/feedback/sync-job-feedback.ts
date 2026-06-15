import { BACKEND_NAME } from '@/constants/backend';
import { formatSyncJobFailedOutcome } from '@/lib/feedback/format-operation-outcome';
import { reportOutcome } from '@/lib/feedback/report-feedback';
import { withSyncRunMeta } from '@/lib/feedback/sync-run-context';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

interface PendingSyncJobReport {
  jobType: string;
  localId: string;
  message: string;
  meta?: {
    failureClass?: string;
    failureStage?: string;
    hadRemoteId?: boolean;
    retryAttempt?: number;
  };
}

const pendingJobs: PendingSyncJobReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushPendingSyncJobReports(): void {
  if (pendingJobs.length === 0) return;

  const jobs = [...pendingJobs];
  pendingJobs.length = 0;
  flushTimer = null;

  if (jobs.length === 1) {
    const job = jobs[0];
    const outcome = formatSyncJobFailedOutcome(job.message, job.jobType);
    reportOutcome(
      {
        ...outcome,
        meta: withSyncRunMeta({
          ...outcome.meta,
          entityId: job.localId,
          jobType: job.jobType,
          ...job.meta,
        }),
      },
      { toast: false, log: true, sync: true }
    );
    return;
  }

  const first = jobs[0];
  reportOutcome(
    {
      kind: 'sync_job_failed',
      status: 'partial',
      title: formatSyncJobFailedOutcome(first.message, first.jobType).title,
      message: `${jobs.length} operaciones de cola fallaron. Revisa los pagos con error de sync.`,
      meta: withSyncRunMeta({
        failedCount: jobs.length,
        jobType: first.jobType,
        entityId: first.localId,
        ...first.meta,
      }),
    },
    { toast: false, log: true, sync: true }
  );
}

export function reportSyncJobFailure(
  jobType: string,
  localId: string,
  error: unknown,
  meta?: PendingSyncJobReport['meta'],
  fallback = `No se pudo sincronizar con ${BACKEND_NAME}.`
): void {
  const { message } = getUserErrorMessage(error, 'action', fallback);
  pendingJobs.push({ jobType, localId, message, meta });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushPendingSyncJobReports, 500);
}

export function resetSyncJobFeedbackForTests(): void {
  pendingJobs.length = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
