import * as Burnt from 'burnt';

import { logger } from '@/lib/logger';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

export function useGlobalErrorHandler() {
  const showSuccess = (title: string, message?: string) => {
    void Burnt.toast({
      title,
      message,
      preset: 'done',
      haptic: 'success',
    });
  };

  const handleFetchError = (error: unknown, fallbackMessage?: string) => {
    const { title, message } = getUserErrorMessage(error, 'fetch', fallbackMessage);
    logger.error('Fetch error', {
      rawMessage: error instanceof Error ? error.message : String(error),
      userMessage: message,
    });
    void Burnt.toast({
      title,
      message,
      preset: 'error',
      haptic: 'error',
    });
  };

  const handleCrudError = (error: unknown, fallbackMessage?: string) => {
    const { title, message } = getUserErrorMessage(error, 'action', fallbackMessage);
    logger.error('CRUD error', {
      rawMessage: error instanceof Error ? error.message : String(error),
      userMessage: message,
    });
    void Burnt.toast({
      title,
      message,
      preset: 'error',
      haptic: 'error',
    });
  };

  return { showSuccess, handleFetchError, handleCrudError };
}
