type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export const authEvents = {
  onUnauthorized(listener: UnauthorizedListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitUnauthorized(): void {
    for (const listener of listeners) {
      listener();
    }
  },
};

export type SyncErrorCode =
  | 'auth_unauthorized'
  | 'auth_forbidden'
  | 'conflict'
  | 'validation'
  | 'network'
  | 'unknown';

export function classifyApiError(status: number): SyncErrorCode {
  if (status === 0) return 'network';
  if (status === 401) return 'auth_unauthorized';
  if (status === 403) return 'auth_forbidden';
  if (status === 409) return 'conflict';
  if (status >= 400 && status < 500) return 'validation';
  if (status >= 500) return 'network';
  return 'unknown';
}
