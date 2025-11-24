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
 * Get error metadata by code
 */
export function getErrorMetadata(code: CartErrorCode): CartError {
  const metadata = CART_ERROR_CODES[code];
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
 * Log error to monitoring system with structured context
 * Works on both client and server sides using dynamic imports
 * @param code - Error code from CART_ERROR_CODES
 * @param context - Additional context to send to monitoring
 */
export async function captureCartError(
  code: CartErrorCode,
  context: Record<string, any> = {}
) {
  const metadata = getErrorMetadata(code);

  // Build common payload for Sentry
  const errorPayload = {
    tags: {
      errorCode: code,
      severity: metadata.severity,
    },
    contexts: {
      cart_error: {
        code,
        description: metadata.description,
        ...context,
      },
    },
  };

  // TODO: Integrate Sentry error reporting when @sentry/nextjs is installed
  // Try to report to Sentry (client-side)
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
 * Create a safe error to throw to user
 * Contains error code but not sensitive details
 * Async to allow monitoring integration
 */
export async function createCartError(code: CartErrorCode, context?: Record<string, any>): Promise<Error> {
  const metadata = getErrorMetadata(code);

  // Send details to monitoring
  if (context) {
    await captureCartError(code, context);
  }

  // Return clean error for user
  return new Error(`${code}: ${metadata.userMessage}`);
}
