import { timingSafeEqual } from "crypto";

/**
 * Validates a provided secret against an expected secret using timing-safe comparison.
 *
 * @param provided - The secret provided in the request
 * @param expected - The expected secret from environment variables
 * @returns true if secrets match, false otherwise
 * @throws Error if either secret is empty/missing (misconfiguration)
 */
export function validateSecret(provided: string | null, expected: string | undefined): boolean {
  const providedSecret = provided || "";
  const expectedSecret = expected || "";

  // Reject if either secret is missing - this is a configuration error
  if (!providedSecret || !expectedSecret) {
    return false;
  }

  try {
    const bufProvided = Buffer.from(providedSecret);
    const bufExpected = Buffer.from(expectedSecret);

    // Pad to same length for constant-time comparison
    const bufferLength = Math.max(bufProvided.length, bufExpected.length);
    const paddedProvided = Buffer.alloc(bufferLength);
    const paddedExpected = Buffer.alloc(bufferLength);
    bufProvided.copy(paddedProvided);
    bufExpected.copy(paddedExpected);

    return timingSafeEqual(paddedProvided, paddedExpected);
  } catch {
    return false;
  }
}
