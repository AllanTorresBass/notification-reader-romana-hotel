import type { OperationKind, OperationOutcome, OperationStatus } from '@/types/feedback/operation-outcome.types';

/** Payload sent to kd-gym POST /api/v1/activity-logs */
export interface CreateActivityLogRequest {
  clientEventId: string;
  kind: OperationKind;
  status: OperationStatus;
  title: string;
  message: string;
  meta?: Record<string, string | number | boolean>;
  occurredAt: string;
}

/** Row returned from kd-gym GET /api/v1/activity-logs */
export interface RemoteActivityLogEntry {
  id: string;
  clientEventId: string | null;
  kind: OperationKind;
  status: OperationStatus;
  title: string;
  message: string;
  meta: Record<string, string | number | boolean> | null;
  occurredAt: string;
  createdAt: string;
}

export interface ActivityLogListResponse {
  data: RemoteActivityLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function remoteToActivityLogEntry(remote: RemoteActivityLogEntry): {
  id: string;
  timestamp: number;
  outcome: OperationOutcome;
  synced: boolean;
  remoteId: string;
} {
  return {
    id: remote.clientEventId ?? remote.id,
    remoteId: remote.id,
    timestamp: new Date(remote.occurredAt).getTime(),
    synced: true,
    outcome: {
      kind: remote.kind,
      status: remote.status,
      title: remote.title,
      message: remote.message,
      meta: remote.meta ?? undefined,
    },
  };
}

export function localEntryToCreateRequest(entry: {
  id: string;
  timestamp: number;
  outcome: OperationOutcome;
}): CreateActivityLogRequest {
  return {
    clientEventId: entry.id,
    kind: entry.outcome.kind,
    status: entry.outcome.status,
    title: entry.outcome.title,
    message: entry.outcome.message,
    meta: entry.outcome.meta,
    occurredAt: new Date(entry.timestamp).toISOString(),
  };
}
