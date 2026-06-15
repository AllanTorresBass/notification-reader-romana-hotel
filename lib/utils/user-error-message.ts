import type { SyncErrorCode } from '@/lib/auth/auth-events';
import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { BACKEND_NAME, LA_ROMANA_DEFAULT_API_URL } from '@/constants/backend';

export type UserErrorContext = 'fetch' | 'action';

export interface UserFacingError {
  title: string;
  message: string;
}

const TITLES: Record<UserErrorContext, string> = {
  fetch: 'No se pudo cargar',
  action: 'No se pudo completar',
};

const CODE_MESSAGES: Record<SyncErrorCode, string> = {
  auth_unauthorized: 'Tu sesión expiró. Ve a Ajustes e inicia sesión de nuevo.',
  auth_forbidden: `No tienes permiso para hacer esto en ${BACKEND_NAME}.`,
  conflict: 'Este registro ya fue procesado o modificado en el servidor.',
  validation: 'Revisa los datos e intenta de nuevo.',
  network: `No hay conexión con ${BACKEND_NAME}. Verifica internet en el teléfono y que la URL sea ${LA_ROMANA_DEFAULT_API_URL}`,
  unknown: 'Ocurrió un error inesperado. Intenta de nuevo en un momento.',
};

const KNOWN_TECHNICAL_MESSAGES: Record<string, string> = {
  'API base URL not configured': `Configura la URL de ${BACKEND_NAME} en Ajustes.`,
  'Not authenticated': 'Inicia sesión en Ajustes para continuar.',
  'Failed to load data': 'No pudimos cargar la información. Intenta de nuevo.',
  'Action failed': 'No se pudo completar la acción. Intenta de nuevo.',
  'Could not load apps': 'No pudimos listar las apps instaladas.',
  'Could not clear history': 'No se pudo borrar el historial.',
  'Could not apply retention': 'No se pudo aplicar la retención.',
  'Could not remove package history': 'No se pudo eliminar el historial de la app.',
  'Sync failed': `No se pudo sincronizar con ${BACKEND_NAME}. Intenta de nuevo.`,
  'Confirm failed': 'No se pudo confirmar el pago. Intenta de nuevo.',
};

const DEFAULT_FALLBACK: Record<UserErrorContext, string> = {
  fetch: 'No pudimos cargar la información. Intenta de nuevo.',
  action: 'No se pudo completar la acción. Intenta de nuevo.',
};

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('internet connection') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

function isTechnicalMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return (
    /^request failed \(\d+\)$/i.test(trimmed) ||
    trimmed.startsWith('TypeError:') ||
    trimmed.includes('JSON Parse') ||
    trimmed.includes('Unexpected token') ||
    trimmed.includes('undefined is not')
  );
}

function mapKnownMessage(message: string): string | null {
  return KNOWN_TECHNICAL_MESSAGES[message] ?? null;
}

export function getUserErrorMessage(
  error: unknown,
  context: UserErrorContext = 'action',
  fallback?: string
): UserFacingError {
  const title = TITLES[context];

  if (error instanceof ApiError) {
    const known = mapKnownMessage(error.message);
    if (known) {
      return { title, message: known };
    }

    if (error.status === 0 || error.code === 'network') {
      return { title, message: CODE_MESSAGES.network };
    }

    if (error.status === 401) {
      const apiMessage = error.message.trim();
      if (apiMessage && !isTechnicalMessage(apiMessage) && apiMessage !== 'Not authenticated') {
        return { title, message: apiMessage };
      }
    }

    if (error.status >= 500) {
      const apiMessage = error.message.trim();
      if (apiMessage && !isTechnicalMessage(apiMessage)) {
        return { title, message: apiMessage };
      }
      return {
        title,
        message: `${BACKEND_NAME} respondió con un error interno (${error.status}). Intenta de nuevo o contacta al administrador.`,
      };
    }

    if (error.code === 'validation' || error.code === 'conflict') {
      const apiMessage = error.message.trim();
      if (apiMessage && !isTechnicalMessage(apiMessage)) {
        return { title, message: apiMessage };
      }
    }

    return { title, message: CODE_MESSAGES[error.code] };
  }

  if (isNetworkError(error)) {
    return { title, message: CODE_MESSAGES.network };
  }

  if (error instanceof Error) {
    const known = mapKnownMessage(error.message);
    if (known) {
      return { title, message: known };
    }

    if (!isTechnicalMessage(error.message)) {
      return { title, message: error.message.trim() };
    }
  }

  const fallbackMessage =
    (fallback ? mapKnownMessage(fallback) : null) ??
    fallback ??
    DEFAULT_FALLBACK[context];

  return { title, message: fallbackMessage };
}
