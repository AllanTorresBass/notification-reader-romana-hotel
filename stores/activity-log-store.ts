import { create } from 'zustand';

import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants/storage-keys';
import { formatStorageFailureOutcome } from '@/lib/feedback/format-operation-outcome';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';
import type { ActivityLogEntry, OperationOutcome } from '@/types/feedback/operation-outcome.types';

export const MAX_ENTRIES = 200;
const MAX_FAILED_ENTRIES = 100;

export interface StoredActivityLogEntry extends ActivityLogEntry {
  synced: boolean;
  remoteId: string | null;
}

interface ActivityLogPersistEnvelope {
  version: 1;
  entries: StoredActivityLogEntry[];
}

interface ActivityLogState {
  hydrated: boolean;
  panelExpanded: boolean;
  entries: StoredActivityLogEntry[];
  hydrate: () => Promise<void>;
  setPanelExpanded: (expanded: boolean) => void;
  append: (outcome: OperationOutcome) => StoredActivityLogEntry;
  markSynced: (clientEventId: string, remoteId: string) => void;
  clear: () => Promise<void>;
  mergeRemote: (remoteEntries: StoredActivityLogEntry[]) => void;
}

function createEntry(outcome: OperationOutcome): StoredActivityLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    outcome,
    synced: false,
    remoteId: null,
  };
}

function isPriorityOutcome(status: OperationOutcome['status']): boolean {
  return status === 'failed' || status === 'partial';
}

export function trimActivityLogEntries(
  entries: StoredActivityLogEntry[]
): StoredActivityLogEntry[] {
  if (entries.length <= MAX_ENTRIES) {
    return entries;
  }

  const priority = entries.filter((entry) => isPriorityOutcome(entry.outcome.status));
  const regular = entries.filter((entry) => !isPriorityOutcome(entry.outcome.status));

  const keptPriority = priority.slice(0, MAX_FAILED_ENTRIES);
  const remainingSlots = MAX_ENTRIES - keptPriority.length;
  const keptRegular = regular.slice(0, Math.max(0, remainingSlots));

  return [...keptPriority, ...keptRegular]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ENTRIES);
}

let storageFailureReported = false;

async function persistEntries(entries: StoredActivityLogEntry[]): Promise<void> {
  const trimmed = trimActivityLogEntries(entries);
  await secureStorageClient.setJson(STORAGE_KEYS.activityLog, {
    version: STORAGE_VERSION as 1,
    entries: trimmed,
  } satisfies ActivityLogPersistEnvelope);
}

function reportStorageFailureOnce(error: unknown): void {
  if (storageFailureReported) return;
  storageFailureReported = true;

  void import('@/lib/feedback/report-feedback').then(({ reportOutcome }) => {
    reportOutcome(formatStorageFailureOutcome(), { toast: false, log: true, sync: false });
  });

  void import('@/lib/logger').then(({ logger }) => {
    logger.error('Activity log persist failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  hydrated: false,
  panelExpanded: false,
  entries: [],

  setPanelExpanded: (panelExpanded) => set({ panelExpanded }),

  hydrate: async () => {
    if (get().hydrated) return;

    const envelope = await secureStorageClient.getJson<ActivityLogPersistEnvelope>(
      STORAGE_KEYS.activityLog
    );
    if (envelope?.version === 1 && Array.isArray(envelope.entries)) {
      set({ entries: trimActivityLogEntries(envelope.entries), hydrated: true });
      return;
    }

    set({ hydrated: true });
  },

  append: (outcome) => {
    const entry = createEntry(outcome);
    const entries = trimActivityLogEntries([entry, ...get().entries]);
    set({ entries });
    void persistEntries(entries).catch((error) => {
      reportStorageFailureOnce(error);
    });
    return entry;
  },

  markSynced: (clientEventId, remoteId) => {
    const entries = get().entries.map((entry) =>
      entry.id === clientEventId ? { ...entry, synced: true, remoteId } : entry
    );
    set({ entries });
    void persistEntries(entries).catch((error) => {
      reportStorageFailureOnce(error);
    });
  },

  clear: async () => {
    set({ entries: [] });
    storageFailureReported = false;
    await persistEntries([]);
  },

  mergeRemote: (remoteEntries) => {
    const byId = new Map<string, StoredActivityLogEntry>();
    for (const entry of remoteEntries) {
      byId.set(entry.id, entry);
    }
    for (const local of get().entries) {
      if (!byId.has(local.id)) {
        byId.set(local.id, local);
      }
    }
    const merged = trimActivityLogEntries(
      [...byId.values()].sort((a, b) => b.timestamp - a.timestamp)
    );
    set({ entries: merged });
    void persistEntries(merged).catch((error) => {
      reportStorageFailureOnce(error);
    });
  },
}));

export async function appendActivityLog(outcome: OperationOutcome): Promise<StoredActivityLogEntry> {
  await useActivityLogStore.getState().hydrate();
  return useActivityLogStore.getState().append(outcome);
}

export async function clearActivityLog(): Promise<void> {
  await useActivityLogStore.getState().clear();
}

export function resetActivityLogStorageFailureForTests(): void {
  storageFailureReported = false;
}
