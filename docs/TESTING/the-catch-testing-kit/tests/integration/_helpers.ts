/**
 * Integration Test Helpers
 *
 * Utilities for testing API routes and server-side functionality.
 * These tests run against the actual API endpoints.
 */

import { vi } from "vitest";

/**
 * Base URL for API requests.
 * Uses Next.js dev server by default.
 */
export const API_BASE_URL = process.env.TEST_API_URL ?? "http://localhost:3000";

/**
 * Test tokens for authenticated endpoints.
 * In real tests, these should come from environment variables.
 */
export const testTokens = {
  kitchen: process.env.TEST_KITCHEN_TOKEN ?? "test-kitchen-token",
  internal: process.env.TEST_INTERNAL_API_KEY ?? "test-internal-key",
};

/**
 * Make an API request with common headers.
 */
export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Make an authenticated API request with Bearer token.
 */
export async function authenticatedRequest(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return apiRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Make an API request with x-api-key header.
 */
export async function apiKeyRequest(
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  return apiRequest(path, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      ...options.headers,
    },
  });
}

/**
 * Wait for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a test order number.
 */
export function generateTestOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Test order numbers from fixtures.
 */
export const fixtureOrderNumbers = {
  confirmed: "ORD-1704312000-ABC12",
  preparing: "ORD-1704312120-DEF34",
  ready: "ORD-1704312300-GHI56",
  completed: "ORD-1704311000-JKL78",
  cancelled: "ORD-1704310500-MNO90",
  pending: "ORD-1704312500-PQR12",
};

/**
 * Mock Clerk auth for integration tests.
 * Use this when testing authenticated endpoints without real auth.
 */
export function mockClerkAuth(userId = "user_test123") {
  return {
    userId,
    sessionId: "sess_test123",
    getToken: vi.fn().mockResolvedValue("mock-token"),
  };
}

/**
 * Create a mock Next.js request for testing API routes directly.
 */
export function createMockRequest(
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Request {
  return new Request(`${API_BASE_URL}/api/test`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Assert response status and parse JSON body.
 */
export async function expectStatus<T = unknown>(
  response: Response,
  expectedStatus: number
): Promise<T> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`
    );
  }
  return response.json() as Promise<T>;
}

/**
 * Assert response is a redirect.
 */
export function expectRedirect(response: Response, location?: string): void {
  if (response.status < 300 || response.status >= 400) {
    throw new Error(`Expected redirect, got status ${response.status}`);
  }
  if (location && response.headers.get("location") !== location) {
    throw new Error(
      `Expected redirect to ${location}, got ${response.headers.get("location")}`
    );
  }
}

/**
 * Skip test if API is not available.
 * Useful for tests that require a running server.
 */
export async function requireApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
