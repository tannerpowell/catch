/**
 * Shared Sanity configuration constants
 * Used across all app code (not scripts) for consistency
 */

// Standardized API version for all Sanity client instances
// Using stable version that works across all features
export const SANITY_API_VERSION = '2025-01-01';

// Default timeout for Sanity fetch requests (10 seconds)
export const SANITY_FETCH_TIMEOUT = 10000;

/**
 * Wraps a promise with a timeout to prevent hanging requests
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = SANITY_FETCH_TIMEOUT
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Request timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
