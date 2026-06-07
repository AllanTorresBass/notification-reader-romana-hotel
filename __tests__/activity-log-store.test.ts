import type { OperationOutcome } from '@/types/feedback/operation-outcome.types';

const mockGetJson = jest.fn();
const mockSetJson = jest.fn();

jest.mock('@/lib/storage/secure-storage-client', () => ({
  secureStorageClient: {
    getJson: (...args: unknown[]) => mockGetJson(...args),
    setJson: (...args: unknown[]) => mockSetJson(...args),
  },
}));

import { appendActivityLog, clearActivityLog, useActivityLogStore } from '@/stores/activity-log-store';

function sampleOutcome(id: number): OperationOutcome {
  return {
    kind: 'pull_sync',
    status: 'completed',
    title: `Sync ${id}`,
    message: `Message ${id}`,
  };
}

describe('activity-log-store', () => {
  beforeEach(async () => {
    mockGetJson.mockResolvedValue(null);
    mockSetJson.mockResolvedValue(undefined);
    useActivityLogStore.setState({ entries: [], hydrated: false });
    await clearActivityLog();
  });

  it('appends entries newest first', async () => {
    await appendActivityLog(sampleOutcome(1));
    await appendActivityLog(sampleOutcome(2));

    const entries = useActivityLogStore.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].outcome.title).toBe('Sync 2');
    expect(entries[1].outcome.title).toBe('Sync 1');
    expect(entries[0].synced).toBe(false);
  });

  it('caps at 50 entries', async () => {
    for (let i = 0; i < 55; i += 1) {
      await appendActivityLog(sampleOutcome(i));
    }
    expect(useActivityLogStore.getState().entries).toHaveLength(50);
    expect(useActivityLogStore.getState().entries[0].outcome.title).toBe('Sync 54');
  });

  it('clears all entries', async () => {
    await appendActivityLog(sampleOutcome(1));
    await clearActivityLog();
    expect(useActivityLogStore.getState().entries).toHaveLength(0);
  });

  it('assigns unique ids and timestamps', async () => {
    const a = await appendActivityLog(sampleOutcome(1));
    const b = await appendActivityLog(sampleOutcome(2));
    expect(a.id).not.toBe(b.id);
    expect(a.timestamp).toBeLessThanOrEqual(b.timestamp);
  });

  it('persists entries to secure storage', async () => {
    await appendActivityLog(sampleOutcome(1));
    expect(mockSetJson).toHaveBeenCalled();
  });

  it('marks entries as synced', async () => {
    const entry = await appendActivityLog(sampleOutcome(1));
    useActivityLogStore.getState().markSynced(entry.id, 'remote-123');
    expect(useActivityLogStore.getState().entries[0].synced).toBe(true);
    expect(useActivityLogStore.getState().entries[0].remoteId).toBe('remote-123');
  });
});
