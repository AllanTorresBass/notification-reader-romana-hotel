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

const MAX_CLIENT_EVENT_ID = 64;
const MAX_TITLE = 200;
const MAX_MESSAGE = 2000;

function sanitizeMeta(
  meta?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  if (!meta) return undefined;

  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function localEntryToCreateRequest(entry: {
  id: string;
  timestamp: number;
  outcome: OperationOutcome;
}): CreateActivityLogRequest {
  const title = entry.outcome.title.trim().slice(0, MAX_TITLE);
  const message = entry.outcome.message.trim().slice(0, MAX_MESSAGE);
  const request: CreateActivityLogRequest = {
    clientEventId: entry.id.slice(0, MAX_CLIENT_EVENT_ID),
    kind: entry.outcome.kind,
    status: entry.outcome.status,
    title: title || 'Actividad',
    message: message || title || 'Sin detalle',
    occurredAt: new Date(entry.timestamp).toISOString(),
  };

  const meta = sanitizeMeta(entry.outcome.meta);
  if (meta) {
    request.meta = meta;
  }

  return request;
}
