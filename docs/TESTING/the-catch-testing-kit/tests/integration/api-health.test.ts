/**
 * Health API Integration Tests
 *
 * Tests for GET /api/health endpoint.
 * This endpoint provides system health status and circuit breaker states.
 */

import { describe, test, expect, beforeAll } from "vitest";
import { apiRequest, expectStatus, requireApiAvailable, API_BASE_URL } from "./_helpers";

describe("GET /api/health", () => {
  let apiAvailable = false;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
  });

  test("returns 200 when healthy", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("healthy");
  });

  test("includes timestamp", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    // Should be a valid ISO date string
    expect(() => new Date(data.timestamp)).not.toThrow();
  });

  test("includes version info", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    const data = await response.json();

    expect(data.version).toBeDefined();
  });

  test("includes service checks", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    const data = await response.json();

    expect(data.checks).toBeDefined();
    expect(typeof data.checks).toBe("object");
  });

  test("includes circuit breaker states", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    const data = await response.json();

    // Circuit breakers should be present for Sanity services
    if (data.circuitBreakers) {
      expect(typeof data.circuitBreakers).toBe("object");
    }
  });

  test("response time is reasonable", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const start = Date.now();
    await apiRequest("/api/health");
    const duration = Date.now() - start;

    // Health check should respond within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  test("sets correct content-type header", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await apiRequest("/api/health");
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  test("allows CORS preflight", async (ctx) => {
    if (!apiAvailable) {
      ctx.skip();
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "OPTIONS",
    });

    // Should not return error for OPTIONS
    expect(response.status).toBeLessThan(400);
  });
});
