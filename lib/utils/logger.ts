/**
 * Structured logging utility for production observability
 *
 * Features:
 * - JSON output in production for log aggregation (Vercel, Datadog, etc.)
 * - Human-readable output in development
 * - Request context tracking
 * - Consistent log levels and formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  path?: string;
  method?: string;
  userId?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const isProduction = process.env.NODE_ENV === 'production';

// Log level priority for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (configurable via environment)
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug');

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production log aggregation
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const levelEmoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[entry.level];

  let output = `${timestamp} ${levelEmoji} [${entry.level.toUpperCase()}] ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = Object.entries(entry.context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ');
    if (contextStr) {
      output += ` | ${contextStr}`;
    }
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack && !isProduction) {
      output += `\n${entry.error.stack.split('\n').slice(1, 4).join('\n')}`;
    }
  }

  return output;
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: context && Object.keys(context).length > 0 ? context : undefined,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

/**
 * Logger instance with convenience methods
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
};

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a request-scoped logger with automatic context
 */
export function createRequestLogger(context: LogContext): typeof logger {
  return {
    debug: (message: string, extraContext?: LogContext) =>
      log('debug', message, { ...context, ...extraContext }),
    info: (message: string, extraContext?: LogContext) =>
      log('info', message, { ...context, ...extraContext }),
    warn: (message: string, extraContext?: LogContext, error?: Error) =>
      log('warn', message, { ...context, ...extraContext }, error),
    error: (message: string, extraContext?: LogContext, error?: Error) =>
      log('error', message, { ...context, ...extraContext }, error),
  };
}

/**
 * Measure and log duration of an async operation
 */
export async function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logger.info(`${operation} completed`, { ...context, duration });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      `${operation} failed`,
      { ...context, duration },
      error instanceof Error ? error : new Error(String(error))
    );

    throw error;
  }
}

/**
 * Log API request/response (for use in middleware or API routes)
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    duration,
    ...context,
  });
}
