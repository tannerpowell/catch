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
  let healthResponse: Response | null = null;
  let healthData: any = null;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
    if (apiAvailable) {
      healthResponse = await apiRequest("/api/health");
      healthData = await healthResponse.json();
    }
  });

  test("returns 200 when healthy", async (ctx) => {
    if (!apiAvailable || !healthResponse) {
      ctx.skip();
      return;
    }

    expect(healthResponse.status).toBe(200);
    expect(healthData.status).toBe("healthy");
  });

  test("includes timestamp", async (ctx) => {
    if (!apiAvailable || !healthData) {
      ctx.skip();
      return;
    }

    expect(healthData.timestamp).toBeDefined();
    const date = new Date(healthData.timestamp);
    expect(date.getTime()).not.toBeNaN();
    expect(date.toISOString()).toBe(healthData.timestamp);
  });

  test("includes version info", async (ctx) => {
    if (!apiAvailable || !healthData) {
      ctx.skip();
      return;
    }

    expect(healthData.version).toBeDefined();
  });

  test("includes service checks", async (ctx) => {
    if (!apiAvailable || !healthData) {
      ctx.skip();
      return;
    }

    expect(healthData.checks).toBeDefined();
    expect(typeof healthData.checks).toBe("object");
  });

  test("includes circuit breaker states", async (ctx) => {
    if (!apiAvailable || !healthData) {
      ctx.skip();
      return;
    }

    // Circuit breakers should be present for Sanity services
    if (healthData.circuitBreakers) {
      expect(typeof healthData.circuitBreakers).toBe("object");
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

    // Health check should respond within 1 second
    expect(duration).toBeLessThan(1000);
  });

  test("sets correct content-type header", async (ctx) => {
    if (!apiAvailable || !healthResponse) {
      ctx.skip();
      return;
    }

    const contentType = healthResponse.headers.get("content-type");
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
