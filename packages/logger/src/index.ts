export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  agencyId?: string;
  locationId?: string;
  service?: string;
  [key: string]: unknown;
}

export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName = 'prosumate-api') {
    this.serviceName = serviceName;
  }

  private format(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      ...(context || {}),
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : {}),
    };

    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      console.debug(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.format('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.format('error', message, context, error));
  }
}

export const logger = new StructuredLogger('prosumate-core');
