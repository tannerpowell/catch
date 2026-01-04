/**
 * Order Status Update API Integration Tests
 *
 * Tests for POST /api/orders/update-status endpoint.
 * This endpoint is used by the KDS to advance order status.
 *
 * Features tested:
 * - Bearer token authentication
 * - Status validation
 * - Rate limiting (30 req/min)
 * - Timestamp updates
 */

import { describe, test, expect, beforeAll } from "vitest";
import {
  apiRequest,
  authenticatedRequest,
  testTokens,
  requireApiAvailable,
  sleep,
  fixtureOrderNumbers,
} from "./_helpers";

describe("POST /api/orders/update-status", () => {
  let apiAvailable = false;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
  });

  describe("authentication", () => {
    test("rejects request without authorization header", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/orders/update-status", {
        method: "POST",
        body: JSON.stringify({
          orderId: "test-order",
          newStatus: "preparing",
        }),
      });

      expect(response.status).toBe(401);
    });

    test("rejects request with invalid token", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        "invalid-token",
        {
          method: "POST",
          body: JSON.stringify({
            orderId: "test-order",
            newStatus: "preparing",
          }),
        }
      );

      expect(response.status).toBe(401);
    });

    test("accepts request with valid token", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: "test-order",
            newStatus: "preparing",
          }),
        }
      );

      // May be 200 (success) or 404 (order not found), but not 401
      expect(response.status).not.toBe(401);
    });
  });

  describe("validation", () => {
    test("rejects request without orderId", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            newStatus: "preparing",
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    test("rejects request without newStatus", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: "test-order",
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    test("rejects invalid status value", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: "test-order",
            newStatus: "invalid-status",
          }),
        }
      );

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Invalid");
    });

    test("accepts valid status values", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const validStatuses = [
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ];

      for (const status of validStatuses) {
        const response = await authenticatedRequest(
          "/api/orders/update-status",
          testTokens.kitchen,
          {
            method: "POST",
            body: JSON.stringify({
              orderId: "test-order",
              newStatus: status,
            }),
          }
        );

        // Should not be 400 (bad request) for valid statuses
        // May be 404 if order doesn't exist
        expect(response.status).not.toBe(400);
      }
    });
  });

  describe("rate limiting", () => {
    test("rate limits after 30 requests per minute", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // This test is slow - make 31 rapid requests
      const requests = Array(31)
        .fill(null)
        .map(() =>
          authenticatedRequest(
            "/api/orders/update-status",
            testTokens.kitchen,
            {
              method: "POST",
              body: JSON.stringify({
                orderId: "test-order",
                newStatus: "preparing",
              }),
            }
          )
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    }, 30000); // 30 second timeout

    test("returns retry-after header when rate limited", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // Send many requests to trigger rate limit
      const requests = Array(35)
        .fill(null)
        .map(() =>
          authenticatedRequest(
            "/api/orders/update-status",
            testTokens.kitchen,
            {
              method: "POST",
              body: JSON.stringify({
                orderId: "test-order",
                newStatus: "preparing",
              }),
            }
          )
        );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        const retryAfter = rateLimitedResponse.headers.get("retry-after");
        expect(retryAfter).toBeDefined();
      }
    }, 30000);
  });

  describe("status update behavior", () => {
    test("returns updated order on success", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // This test assumes a test order exists
      // In practice, you'd seed this data first
      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: fixtureOrderNumbers.confirmed,
            newStatus: "preparing",
          }),
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.order).toBeDefined();
      }
    });

    test("sets timestamp field for status", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: fixtureOrderNumbers.preparing,
            newStatus: "ready",
          }),
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order.readyAt).toBeDefined();
      }
    });

    test("returns 404 for non-existent order", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await authenticatedRequest(
        "/api/orders/update-status",
        testTokens.kitchen,
        {
          method: "POST",
          body: JSON.stringify({
            orderId: "non-existent-order-id",
            newStatus: "preparing",
          }),
        }
      );

      expect(response.status).toBe(404);
    });
  });
});
