import type { SyncErrorCode } from '@/lib/auth/auth-events';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';

export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'validation'
  | 'storage'
  | 'permission'
  | 'unknown';

export interface ClassifiedError {
  errorCode: SyncErrorCode | string;
  category: ErrorCategory;
  recoverable: boolean;
  message: string;
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof ApiError) {
    const category: ErrorCategory =
      error.code === 'auth_unauthorized' || error.code === 'auth_forbidden'
        ? 'auth'
        : error.code === 'network'
          ? 'network'
          : error.code === 'validation' || error.code === 'conflict'
            ? 'validation'
            : 'unknown';

    return {
      errorCode: error.code,
      category,
      recoverable: category === 'network' || error.code === 'auth_unauthorized',
      message: error.message,
    };
  }

  if (isNetworkError(error)) {
    return {
      errorCode: 'network',
      category: 'network',
      recoverable: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('securestore') || lower.includes('storage')) {
    return { errorCode: 'storage_write_failed', category: 'storage', recoverable: true, message };
  }

  if (lower.includes('permission') || lower.includes('not granted')) {
    return { errorCode: 'permission_denied', category: 'permission', recoverable: true, message };
  }

  return { errorCode: 'unknown', category: 'unknown', recoverable: true, message };
}
