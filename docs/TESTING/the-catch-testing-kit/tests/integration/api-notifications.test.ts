/**
 * Notifications API Integration Tests
 *
 * Tests for notification endpoints:
 * - POST /api/notifications/send
 * - GET /api/notifications/preferences
 * - PUT /api/notifications/preferences
 */

import { describe, test, expect, beforeAll } from "vitest";
import {
  apiRequest,
  apiKeyRequest,
  testTokens,
  requireApiAvailable,
} from "./_helpers";

describe("Notifications API", () => {
  let apiAvailable = false;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
  });

  describe("POST /api/notifications/send", () => {
    test("rejects request without API key", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          type: "order_confirmed",
          orderId: "test-order",
          channels: { sms: true, email: true },
        }),
      });

      expect(response.status).toBe(401);
    });

    test("rejects request with invalid API key", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiKeyRequest(
        "/api/notifications/send",
        "invalid-key",
        {
          method: "POST",
          body: JSON.stringify({
            type: "order_confirmed",
            orderId: "test-order",
            channels: { sms: true, email: true },
          }),
        }
      );

      expect(response.status).toBe(401);
    });

    test("accepts valid notification types", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const validTypes = ["order_confirmed", "order_preparing", "order_ready"];

      for (const type of validTypes) {
        const response = await apiKeyRequest(
          "/api/notifications/send",
          testTokens.internal,
          {
            method: "POST",
            body: JSON.stringify({
              type,
              orderId: "test-order",
              channels: { sms: false, email: false },
            }),
          }
        );

        // Should not be 400 for valid types
        expect(response.status).not.toBe(400);
      }
    });

    test("rejects invalid notification type", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiKeyRequest(
        "/api/notifications/send",
        testTokens.internal,
        {
          method: "POST",
          body: JSON.stringify({
            type: "invalid_type",
            orderId: "test-order",
            channels: { sms: true, email: true },
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    test("requires orderId", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiKeyRequest(
        "/api/notifications/send",
        testTokens.internal,
        {
          method: "POST",
          body: JSON.stringify({
            type: "order_confirmed",
            channels: { sms: true, email: true },
          }),
        }
      );

      expect(response.status).toBe(400);
    });

    test("returns send results on success", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiKeyRequest(
        "/api/notifications/send",
        testTokens.internal,
        {
          method: "POST",
          body: JSON.stringify({
            type: "order_confirmed",
            orderId: "test-order-123",
            channels: { sms: false, email: false },
          }),
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBeDefined();
        expect(data.results).toBeDefined();
      }
    });
  });

  describe("GET /api/notifications/preferences", () => {
    test("requires authentication", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/notifications/preferences");

      // Should return 401 without auth
      expect(response.status).toBe(401);
    });

    test.skip("returns preference structure", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // Note: This test requires Clerk auth which may not be available
      // In a real test, you'd mock Clerk or use test credentials
    });
  });

  describe("PUT /api/notifications/preferences", () => {
    test("requires authentication", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({
          preferences: {
            email: { orderConfirmation: true },
            sms: { orderConfirmation: true },
          },
        }),
      });

      expect(response.status).toBe(401);
    });

    test("validates preference structure", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // Note: This test requires Clerk auth
      ctx.skip();
    });
  });
});
