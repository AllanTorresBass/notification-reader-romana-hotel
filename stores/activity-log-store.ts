import { create } from 'zustand';

import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants/storage-keys';
import { secureStorageClient } from '@/lib/storage/secure-storage-client';
import type { ActivityLogEntry, OperationOutcome } from '@/types/feedback/operation-outcome.types';

const MAX_ENTRIES = 50;

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

async function persistEntries(entries: StoredActivityLogEntry[]): Promise<void> {
  await secureStorageClient.setJson(STORAGE_KEYS.activityLog, {
    version: STORAGE_VERSION as 1,
    entries: entries.slice(0, MAX_ENTRIES),
  } satisfies ActivityLogPersistEnvelope);
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
      set({ entries: envelope.entries.slice(0, MAX_ENTRIES), hydrated: true });
      return;
    }

    set({ hydrated: true });
  },

  append: (outcome) => {
    const entry = createEntry(outcome);
    const entries = [entry, ...get().entries].slice(0, MAX_ENTRIES);
    set({ entries });
    void persistEntries(entries);
    return entry;
  },

  markSynced: (clientEventId, remoteId) => {
    const entries = get().entries.map((entry) =>
      entry.id === clientEventId ? { ...entry, synced: true, remoteId } : entry
    );
    set({ entries });
    void persistEntries(entries);
  },

  clear: async () => {
    set({ entries: [] });
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
    const merged = [...byId.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ENTRIES);
    set({ entries: merged });
    void persistEntries(merged);
  },
}));

export async function appendActivityLog(outcome: OperationOutcome): Promise<StoredActivityLogEntry> {
  await useActivityLogStore.getState().hydrate();
  return useActivityLogStore.getState().append(outcome);
}

export async function clearActivityLog(): Promise<void> {
  await useActivityLogStore.getState().clear();
}
