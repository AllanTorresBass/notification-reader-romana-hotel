import { appendDiagnostic } from '@/lib/diagnostics/diagnostic-ring';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const prefix = `[NotificationReader][${level.toUpperCase()}]`;
  if (!context || Object.keys(context).length === 0) {
    return `${prefix} ${message}`;
  }
  return `${prefix} ${message} ${JSON.stringify(context)}`;
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  appendDiagnostic(level, message, context);

  if (!__DEV__) {
    return;
  }

  const formatted = formatMessage(level, message, context);
  // eslint-disable-next-line no-console
  if (level === 'debug') console.debug(formatted);
  // eslint-disable-next-line no-console
  else if (level === 'info') console.info(formatted);
  // eslint-disable-next-line no-console
  else if (level === 'warn') console.warn(formatted);
  // eslint-disable-next-line no-console
  else console.error(formatted);
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    writeLog('debug', message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    writeLog('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    writeLog('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    writeLog('error', message, context);
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
