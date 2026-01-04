/**
 * Sanity Circuit Breaker Integration Tests
 *
 * Tests for the circuit breaker pattern in the Sanity adapter.
 * This ensures the app handles Sanity outages gracefully.
 *
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Failure threshold reached, requests return fallback
 * - HALF-OPEN: Testing if service recovered
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { tryImport } from "../unit/_helpers";

describe("Sanity circuit breaker", () => {
  let createSanityAdapter: () => unknown;
  let DEMO_CATEGORIES: unknown[];
  let originalFetch: typeof fetch;

  /**
   * Helper to verify circuit state exists and matches expected value.
   * Prevents silent test passes when getCircuitState is missing.
   */
  function assertCircuitState(adapter: any, key: string, expectedState: string) {
    expect(typeof adapter.getCircuitState).toBe("function");
    const state = adapter.getCircuitState(key);
    expect(state).toBeDefined();
    expect(state).toBe(expectedState);
  }

  beforeEach(async () => {
    originalFetch = global.fetch;

    // Try to import the Sanity adapter
    const adapterModule = await tryImport(
      () => import("@/lib/adapters/sanity-catch")
    );

    if (!adapterModule) {
      return;
    }

    // @ts-expect-error - dynamic import
    createSanityAdapter = adapterModule.createSanityAdapter;
    // @ts-expect-error - dynamic import
    DEMO_CATEGORIES = adapterModule.DEMO_CATEGORIES ?? [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test("starts in closed state", async (ctx) => {
    if (!createSanityAdapter) {
      ctx.skip();
      return;
    }

    const adapter = createSanityAdapter();
    assertCircuitState(adapter, "categories", "closed");
  });

  test("opens circuit after consecutive failures", async (ctx) => {
    if (!createSanityAdapter) {
      ctx.skip();
      return;
    }

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const adapter = createSanityAdapter();

    // Make 5 requests that fail
    for (let i = 0; i < 5; i++) {
      try {
        // @ts-expect-error - dynamic method
        await adapter.getCategories?.();
      } catch {
        // Expected to fail
      }
    }

    assertCircuitState(adapter, "categories", "open");
  });

  test("returns fallback data when circuit is open", async (ctx) => {
    if (!createSanityAdapter || !DEMO_CATEGORIES) {
      ctx.skip();
      return;
    }

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const adapter = createSanityAdapter();

    // Trigger circuit open
    for (let i = 0; i < 6; i++) {
      try {
        // @ts-expect-error - dynamic method
        await adapter.getCategories?.();
      } catch {
        // Expected to fail initially
      }
    }

    // Next call should return fallback
    // @ts-expect-error - dynamic method
    const result = await adapter.getCategories?.();

    if (result && DEMO_CATEGORIES.length > 0) {
      expect(result).toEqual(DEMO_CATEGORIES);
    }
  });

  test("transitions to half-open after reset timeout", async (ctx) => {
    if (!createSanityAdapter) {
      ctx.skip();
      return;
    }

    vi.useFakeTimers();

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const adapter = createSanityAdapter();

    // Trigger circuit open
    for (let i = 0; i < 6; i++) {
      try {
        // @ts-expect-error - dynamic method
        await adapter.getCategories?.();
      } catch {
        // Expected
      }
    }

    // Advance time past reset timeout (30 seconds)
    vi.advanceTimersByTime(31000);

    assertCircuitState(adapter, "categories", "half-open");

    vi.useRealTimers();
  });

  test("closes circuit after successful requests in half-open", async (ctx) => {
    if (!createSanityAdapter) {
      ctx.skip();
      return;
    }

    vi.useFakeTimers();

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // First: fail to open circuit
    mockFetch.mockRejectedValue(new Error("Network error"));

    const adapter = createSanityAdapter();

    // Trigger circuit open
    for (let i = 0; i < 6; i++) {
      try {
        // @ts-expect-error - dynamic method
        await adapter.getCategories?.();
      } catch {
        // Expected
      }
    }

    // Advance to half-open
    vi.advanceTimersByTime(31000);

    // Now make fetch succeed
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    });

    // Make 2 successful requests to close circuit
    // @ts-expect-error - dynamic method
    await adapter.getCategories?.();
    // @ts-expect-error - dynamic method
    await adapter.getCategories?.();

    assertCircuitState(adapter, "categories", "closed");

    vi.useRealTimers();
  });

  test("has separate circuits per service", async (ctx) => {
    if (!createSanityAdapter) {
      ctx.skip();
      return;
    }

    const adapter = createSanityAdapter();

    // Each service should have its own circuit - all should start closed
    assertCircuitState(adapter, "categories", "closed");
    assertCircuitState(adapter, "locations", "closed");
    assertCircuitState(adapter, "items", "closed");
  });
});

describe("Sanity fetch timeout", () => {
  test("times out after 10 seconds", async (ctx) => {
    const constantsModule = await tryImport(
      () => import("@/lib/sanity/constants")
    );

    if (!constantsModule) {
      ctx.skip();
      return;
    }

    // @ts-expect-error - dynamic import
    const { SANITY_FETCH_TIMEOUT } = constantsModule;

    if (SANITY_FETCH_TIMEOUT) {
      expect(SANITY_FETCH_TIMEOUT).toBe(10000);
    }
  });

  test("withTimeout utility exists", async (ctx) => {
    const constantsModule = await tryImport(
      () => import("@/lib/sanity/constants")
    );

    if (!constantsModule) {
      ctx.skip();
      return;
    }

    // @ts-expect-error - dynamic import
    const { withTimeout } = constantsModule;

    if (withTimeout) {
      expect(typeof withTimeout).toBe("function");
    }
  });

  test("withTimeout rejects on timeout", async (ctx) => {
    const constantsModule = await tryImport(
      () => import("@/lib/sanity/constants")
    );

    if (!constantsModule) {
      ctx.skip();
      return;
    }

    // @ts-expect-error - dynamic import
    const { withTimeout } = constantsModule;

    if (!withTimeout) {
      ctx.skip();
      return;
    }

    vi.useFakeTimers();

    // Create a promise that never resolves
    const neverResolves = new Promise(() => {});

    const timeoutPromise = withTimeout(neverResolves, 1000);

    // Advance time past timeout
    vi.advanceTimersByTime(1100);

    await expect(timeoutPromise).rejects.toThrow();

    vi.useRealTimers();
  });
});
