type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const prefix = `[NotificationReader][${level.toUpperCase()}]`;
  if (!context || Object.keys(context).length === 0) {
    return `${prefix} ${message}`;
  }
  return `${prefix} ${message} ${JSON.stringify(context)}`;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message, context));
    }
  },
  info(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('info', message, context));
    }
  },
  warn(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('warn', message, context));
    }
  },
  error(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(formatMessage('error', message, context));
    }
  },
};

export const uxLogger = {
  event(name: string, context?: Record<string, unknown>): void {
    logger.info(`ux.${name}`, context);
  },
  operation(context: Record<string, unknown>): void {
    logger.info('ux.operation', context);
  },
};
