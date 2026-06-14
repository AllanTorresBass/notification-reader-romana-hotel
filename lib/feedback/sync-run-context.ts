let currentSyncRunId: string | null = null;

export function beginSyncRun(): string {
  currentSyncRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return currentSyncRunId;
}

export function getSyncRunId(): string | undefined {
  return currentSyncRunId ?? undefined;
}

export function endSyncRun(): void {
  currentSyncRunId = null;
}

export function withSyncRunMeta(
  meta?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  const syncRunId = getSyncRunId();
  if (!syncRunId) return meta ?? {};
  return { ...meta, syncRunId };
}
