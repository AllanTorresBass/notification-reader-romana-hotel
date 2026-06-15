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

export const syncStatusSchema = z.enum([
  'pending_sync',
  'synced',
  'payment_confirmed',
  'client_assigned',
  'sync_failed',
]);

export const paymentRegisterCacheEntrySchema = z.object({
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
  assignedClientId: z.string().nullable().optional().transform((v) => v ?? null),
  assignedClientName: z.string().nullable().optional().transform((v) => v ?? null),
  lastSyncError: z.string().nullable(),
  failureClass: paymentFailureClassSchema.nullable().optional().transform((v) => v ?? null),
  failureStage: paymentFailureStageSchema.nullable().optional().transform((v) => v ?? null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const paymentRegisterStoreEnvelopeSchema = z.object({
  version: z.literal(1),
  entries: z.array(paymentRegisterCacheEntrySchema),
});

export const paymentSyncJobSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['create_register', 'confirm_payment', 'assign_client', 'pull_registers']),
  localId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  attempts: z.number().int().min(0),
  nextRetryAt: z.number(),
  createdAt: z.number(),
});

export const paymentSyncQueueEnvelopeSchema = z.object({
  version: z.literal(1),
  jobs: z.array(paymentSyncJobSchema),
});
