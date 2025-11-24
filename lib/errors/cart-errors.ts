/**
 * Cart and ecommerce error codes and utilities
 * Centralized definition of error codes with metadata for monitoring and user messaging
 */

export interface CartError {
  code: string;
  userMessage: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  suggestedAction: string;
}

/**
 * Safe context interface for error reporting
 * SECURITY: Only includes non-sensitive fields that are safe to log/monitor
 * DO NOT add user objects, PII, tokens, or API responses here
 */
export interface SafeErrorContext {
  /** Location slug (non-sensitive identifier) */
  slug?: string;
  /** Error code or message (already sanitized) */
  errorCode?: string;
  errorMessage?: string;
  /** Item/order IDs (non-sensitive identifiers) */
  itemId?: string;
  orderId?: string;
  /** Request metadata (non-sensitive) */
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

/**
 * Standardized error codes for cart operations
 * Format: {COMPONENT}_{ISSUE}_{SEQUENCE}
 * Example: LOC_MISSING_001 = Location + Missing _id + First occurrence
 */
export const CART_ERROR_CODES = {
  LOC_MISSING_001: {
    code: 'LOC_MISSING_001',
    userMessage: 'Location configuration error. Please contact support if this persists.',
    severity: 'critical',
    description: 'Location _id could not be resolved from Sanity. Location may not exist or data is corrupted.',
    suggestedAction: 'Verify location exists in Sanity Studio with matching slug. Check Sentry for full error context.',
  },
  LOC_INVALID_002: {
    code: 'LOC_INVALID_002',
    userMessage: 'Invalid location data. Please try again or select a different location.',
    severity: 'error',
    description: 'Location data exists but is missing required fields or structure is corrupted.',
    suggestedAction: 'Check location schema in Sanity. Verify all required fields are populated.',
  },
  CART_HYDRATION_003: {
    code: 'CART_HYDRATION_003',
    userMessage: 'Unable to load cart. Refreshing page may help.',
    severity: 'error',
    description: 'Cart hydration from localStorage failed or cart state is inconsistent.',
    suggestedAction: 'Check browser localStorage for corruption. Users may need to clear site data.',
  },
} as const;

export type CartErrorCode = keyof typeof CART_ERROR_CODES;

/**
 * Retrieve structured cart error metadata for a given error code.
 *
 * Accepts both known error codes and arbitrary strings for flexibility.
 * Unknown codes will return a generic UNKNOWN_ERROR metadata object.
 *
 * @param code - The cart error code to look up (known code or arbitrary string)
 * @returns The corresponding CartError metadata, or UNKNOWN_ERROR fallback
 */
export function getErrorMetadata(code: CartErrorCode | string): CartError {
  const metadata = CART_ERROR_CODES[code as CartErrorCode];
  if (!metadata) {
    return {
      code: 'UNKNOWN_ERROR',
      userMessage: 'An unknown error occurred. Please try again.',
      severity: 'error',
      description: `Unknown error code: ${code}`,
      suggestedAction: 'Check logs for more information.',
    };
  }
  return metadata;
}

/**
 * Send structured cart error metadata to the configured monitoring system.
 *
 * Reports the provided cart error code with standardized tags and a `cart_error`
 * context payload. If reporting fails it is swallowed (no exception is thrown).
 * In development, the same metadata is also written to the console for debugging.
 *
 * This function is async to support future Sentry integration, but currently
 * only performs synchronous console logging in development.
 *
 * SECURITY: Only pass non-sensitive context via SafeErrorContext interface.
 * DO NOT pass user objects, PII, passwords, tokens, or raw API responses.
 *
 * @param code - Key identifying the cart error to report (known code or string)
 * @param context - Safe, non-sensitive contextual fields (see SafeErrorContext)
 */
export async function captureCartError(
  code: CartErrorCode | string,
  context: SafeErrorContext = {}
) {
  const metadata = getErrorMetadata(code);

  // Build common payload for Sentry (uncomment when Sentry is enabled)
  // const errorPayload = {
  //   tags: {
  //     errorCode: code,
  //     severity: metadata.severity,
  //   },
  //   contexts: {
  //     cart_error: {
  //       code,
  //       description: metadata.description,
  //       ...context,
  //     },
  //   },
  // };

  // Sentry reporting disabled - @sentry/nextjs not installed
  // To enable error reporting:
  // 1. Run: npm install @sentry/nextjs
  // 2. Configure Sentry in your app
  // 3. Uncomment the code below

  // // Try to report to Sentry (client-side)
  // if (typeof window !== 'undefined') {
  //   try {
  //     // Dynamically import client-side Sentry to avoid bundling on server
  //     const { captureException } = await import('@sentry/nextjs');
  //     captureException(new Error(code), errorPayload);
  //   } catch (e) {
  //     // Sentry not initialized or import failed - continue gracefully
  //     if (process.env.NODE_ENV === 'development') {
  //       console.warn('[CartError] Failed to report to Sentry (client):', e);
  //     }
  //   }
  // } else {
  //   // Server-side error reporting
  //   try {
  //     // Use server-side Sentry via @sentry/nextjs
  //     const { captureException } = await import('@sentry/nextjs');
  //     captureException(new Error(code), errorPayload);
  //   } catch (e) {
  //     // Sentry not initialized or import failed - continue gracefully
  //     if (process.env.NODE_ENV === 'development') {
  //       console.warn('[CartError] Failed to report to Sentry (server):', e);
  //     }
  //   }
  // }

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[${code}] ${metadata.description}`,
      { context, suggestedAction: metadata.suggestedAction }
    );
  }
}

/**
 * Create a sanitized Error for user consumption (synchronous).
 *
 * This is the main error factory for UI components. It returns a standard Error
 * object immediately without awaiting any async telemetry.
 *
 * If you need to report the error to monitoring, use `reportCartError` separately
 * or call `captureCartError` in a fire-and-forget manner.
 *
 * SECURITY: Only pass non-sensitive context via SafeErrorContext interface.
 * DO NOT pass user objects, PII, passwords, tokens, or raw API responses.
 *
 * @param code - Cart error code identifying the error metadata to use for message
 * @param context - Safe, non-sensitive context for debugging (see SafeErrorContext)
 * @returns An Error with message formatted as `<code>: <userMessage>`
 */
export function createCartError(
  code: CartErrorCode | string,
  context?: SafeErrorContext
): Error {
  const metadata = getErrorMetadata(code);

  // Log in development for debugging (synchronous)
  if (process.env.NODE_ENV === 'development' && context) {
    console.error(
      `[${code}] ${metadata.description}`,
      { context, suggestedAction: metadata.suggestedAction }
    );
  }

  // Return clean error for user
  return new Error(`${code}: ${metadata.userMessage}`);
}

/**
 * Report a cart error to monitoring systems asynchronously.
 *
 * Use this when you need to ensure error reporting completes before continuing,
 * or when you want explicit control over when telemetry is sent.
 *
 * For most cases, prefer the synchronous `createCartError` and let error
 * boundaries handle reporting.
 *
 * SECURITY: Only pass non-sensitive context via SafeErrorContext interface.
 * DO NOT pass user objects, PII, passwords, tokens, or raw API responses.
 *
 * @param code - Cart error code to report
 * @param context - Safe, non-sensitive context for monitoring (see SafeErrorContext)
 */
export async function reportCartError(
  code: CartErrorCode | string,
  context: SafeErrorContext = {}
): Promise<void> {
  await captureCartError(code, context);
}