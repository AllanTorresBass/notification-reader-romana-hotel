const recentKeys = new Map<string, number>();
const DEDUPE_TTL_MS = 30_000;

export function shouldSkipDuplicateReport(kind: string, message: string, status: string): boolean {
  if (status !== 'failed' && status !== 'partial') {
    return false;
  }

  const key = `${kind}:${message}`;
  const now = Date.now();
  const last = recentKeys.get(key);

  if (last !== undefined && now - last < DEDUPE_TTL_MS) {
    return true;
  }

  recentKeys.set(key, now);

  if (recentKeys.size > 200) {
    for (const [k, ts] of recentKeys) {
      if (now - ts > DEDUPE_TTL_MS) {
        recentKeys.delete(k);
      }
    }
  }

  return false;
}

export function resetReportDedupeForTests(): void {
  recentKeys.clear();
}
