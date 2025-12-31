/**
 * Retry utility with exponential backoff for external service calls
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponential?: boolean;
  /** Optional callback for logging retry attempts */
  onRetry?: (error: Error, attempt: number) => void;
  /** Errors that should not be retried (e.g., 4xx responses) */
  noRetryOn?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'noRetryOn'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
};

/**
 * Executes a function with retry logic and exponential backoff
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this error type should not be retried
      if (opts.noRetryOn?.(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // Call the retry callback if provided
      opts.onRetry?.(lastError, attempt);

      // Calculate delay with exponential backoff
      const delay = opts.exponential
        ? Math.min(opts.baseDelay * Math.pow(2, attempt - 1), opts.maxDelay)
        : opts.baseDelay;

      // Add jitter (±10%) to prevent thundering herd
      const jitter = delay * 0.1 * (Math.random() * 2 - 1);
      await sleep(delay + jitter);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Retry failed');
}

/**
 * Check if an error is a transient network error that should be retried
 */
export function isTransientError(error: Error): boolean {
  const transientMessages = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'socket hang up',
    'network',
    'timeout',
    'aborted',
  ];

  const message = error.message.toLowerCase();
  return transientMessages.some(msg => message.includes(msg.toLowerCase()));
}

/**
 * Check if an HTTP error should not be retried (4xx errors except 429)
 */
export function isNonRetryableHttpError(error: Error): boolean {
  // Rate limiting should be retried
  if (error.message.includes('429')) return false;

  // Check for 4xx HTTP status codes in common error message patterns
  // Matches: "status 4xx", "HTTP 4xx", "code 4xx", or standalone status codes
  const match = error.message.match(/\b(?:status|http|code)?\s*4\d{2}\b/i);
  return match !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
