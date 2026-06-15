import { z } from 'zod';

const paymentFailureClassSchema = z.enum([
  'parse_failed',
  'parse_partial',
  'missing_mobile',
  'auth_required',
  'network_error',
  'validation_error',
  'forbidden',
  'confirm_unsynced',
  'duplicate_key',
  'unknown',
]);

const paymentFailureStageSchema = z.enum(['parse', 'enqueue', 'create', 'confirm', 'pull']);

const syncStatusValues = [
  'pending_sync',
  'synced',
  'payment_confirmed',
  'sync_failed',
] as const;

export const syncStatusSchema = z.preprocess((value) => {
  if (value === 'client_assigned') return 'payment_confirmed';
  return value;
}, z.enum(syncStatusValues));

function normalizeLegacyPaymentEntry(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const entry = { ...raw } as Record<string, unknown>;
  if (entry.syncStatus === 'client_assigned') {
    entry.syncStatus = 'payment_confirmed';
  }
  delete entry.assignedClientId;
  delete entry.assignedClientName;
  return entry;
}

export const paymentRegisterCacheEntrySchema = z.preprocess(
  normalizeLegacyPaymentEntry,
  z.object({
    localId: z.string().min(1),
    remoteRegisterId: z.string().nullable(),
    remoteInvoiceId: z.string().nullable(),
    name: z.string().nullable(),
    pago: z.string().min(1),
    mobile: z.string().min(1),
    ref: z.string(),
    paymentDate: z.string(),
    paymentTime: z.string(),
    notificationKey: z.string().min(1),
    notificationId: z.string().min(1),
    invoiceStatus: z.enum(['pending', 'paid']).nullable(),
    syncStatus: syncStatusSchema,
    lastSyncError: z.string().nullable(),
    failureClass: paymentFailureClassSchema.nullable().optional().transform((v) => v ?? null),
    failureStage: paymentFailureStageSchema.nullable().optional().transform((v) => v ?? null),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
);

export const paymentRegisterStoreEnvelopeSchema = z.object({
  version: z.literal(1),
  entries: z.array(paymentRegisterCacheEntrySchema),
});

const paymentSyncJobTypeSchema = z.enum(['create_register', 'confirm_payment', 'pull_registers']);

export const paymentSyncJobSchema = z.object({
  id: z.string().min(1),
  type: paymentSyncJobTypeSchema,
  localId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  attempts: z.number().int().min(0),
  nextRetryAt: z.number(),
  createdAt: z.number(),
});

function normalizeLegacySyncQueue(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const envelope = raw as { version?: number; jobs?: unknown[] };
  if (!Array.isArray(envelope.jobs)) return envelope;
  return {
    ...envelope,
    jobs: envelope.jobs.filter((job) => {
      if (typeof job !== 'object' || job === null || !('type' in job)) return false;
      return (job as { type: string }).type !== 'assign_client';
    }),
  };
}

export const paymentSyncQueueEnvelopeSchema = z.preprocess(
  normalizeLegacySyncQueue,
  z.object({
    version: z.literal(1),
    jobs: z.array(paymentSyncJobSchema),
  })
);
