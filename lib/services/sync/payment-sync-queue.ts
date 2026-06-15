import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants/storage-keys';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';
import { logger } from '@/lib/logger';
import { paymentSyncQueueEnvelopeSchema } from '@/types/payment/payment-register-cache.schemas';
import type { PaymentSyncJob, PaymentSyncJobType } from '@/types/payment/payment-register-cache.types';

const MAX_BACKOFF_MS = 60_000;
const BASE_BACKOFF_MS = 1_000;

function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class PaymentSyncQueue {
  private jobs: PaymentSyncJob[] | null = null;

  private async hydrate(): Promise<PaymentSyncJob[]> {
    if (this.jobs) return this.jobs;

    const envelope = await secureStorageClient.getJson<unknown>(STORAGE_KEYS.paymentSyncQueue);
    if (!envelope) {
      this.jobs = [];
      return this.jobs;
    }

    const parsed = paymentSyncQueueEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      logger.warn('Invalid sync queue envelope, resetting');
      this.jobs = [];
      return this.jobs;
    }

    this.jobs = parsed.data.jobs;
    return this.jobs;
  }

  private async persist(jobs: PaymentSyncJob[]): Promise<void> {
    this.jobs = jobs;
    await secureStorageClient.setJson(STORAGE_KEYS.paymentSyncQueue, {
      version: STORAGE_VERSION as 1,
      jobs,
    });
  }

  async enqueue(
    type: PaymentSyncJobType,
    localId: string,
    payload?: Record<string, unknown>
  ): Promise<PaymentSyncJob> {
    const jobs = await this.hydrate();
    const existing = jobs.find((j) => j.type === type && j.localId === localId);
    if (existing) return existing;

    const job: PaymentSyncJob = {
      id: generateJobId(),
      type,
      localId,
      payload,
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    };
    await this.persist([...jobs, job]);
    return job;
  }

  async getDueJobs(): Promise<PaymentSyncJob[]> {
    const jobs = await this.hydrate();
    const now = Date.now();
    return jobs.filter((j) => j.nextRetryAt <= now);
  }

  async removeJob(jobId: string): Promise<void> {
    const jobs = await this.hydrate();
    await this.persist(jobs.filter((j) => j.id !== jobId));
  }

  async markFailed(job: PaymentSyncJob, error: string): Promise<void> {
    const jobs = await this.hydrate();
    const attempts = job.attempts + 1;
    const backoff = Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
    const updated: PaymentSyncJob = {
      ...job,
      attempts,
      nextRetryAt: Date.now() + backoff,
      payload: { ...job.payload, lastError: error },
    };
    await this.persist(jobs.map((j) => (j.id === job.id ? updated : j)));
  }

  async getPendingCount(): Promise<number> {
    const jobs = await this.hydrate();
    return jobs.length;
  }

  async hasPendingJobForLocalId(localId: string): Promise<boolean> {
    const jobs = await this.hydrate();
    return jobs.some((job) => job.localId === localId);
  }

  async clear(): Promise<void> {
    await this.persist([]);
  }
}

export const paymentSyncQueue = new PaymentSyncQueue();
