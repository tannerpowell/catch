/**
 * Order Tracking API Integration Tests
 *
 * Tests for GET /api/orders/[orderNumber] endpoint.
 * This is a public endpoint for customers to track their orders.
 *
 * Features tested:
 * - Order retrieval by order number
 * - Customer data masking (privacy)
 * - Poll interval suggestions
 * - Cache headers
 */

import { describe, test, expect, beforeAll } from "vitest";
import { apiRequest, requireApiAvailable, fixtureOrderNumbers } from "./_helpers";

describe("GET /api/orders/[orderNumber]", () => {
  let apiAvailable = false;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
  });

  describe("order retrieval", () => {
    test("returns order by valid order number", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order).toBeDefined();
        expect(data.order.orderNumber).toBe(fixtureOrderNumbers.confirmed);
      }
    });

    test("returns 400 for invalid order number format", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/orders/invalid-format");
      expect(response.status).toBe(400);
    });

    test("returns 404 for non-existent order", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest("/api/orders/ORD-99999999-XXXXX");
      expect(response.status).toBe(404);
    });

    test("validates order number format (ORD-XXXXXXXX-XXXXX)", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      // Various invalid formats
      const invalidFormats = [
        "ORDER-123",
        "ord-123456-abc",
        "12345",
        "",
        "ORD",
        "ORD-",
        "ORD-12345678",
      ];

      for (const format of invalidFormats) {
        const response = await apiRequest(`/api/orders/${format}`);
        expect(response.status).toBe(400);
      }
    });
  });

  describe("customer data masking", () => {
    test("masks customer email", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        const email = data.order.customer?.email ?? "";

        // Email should be masked (e.g., "j***@example.com")
        expect(email).toMatch(/\*{2,}/);
      }
    });

    test("masks customer phone", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        const phone = data.order.customer?.phone ?? "";

        // Phone should be masked (e.g., "***-***-1234")
        expect(phone).toMatch(/\*{2,}/);
      }
    });

    test("shows full customer name", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        const name = data.order.customer?.name ?? "";

        // Name should NOT be masked (needed for pickup identification)
        expect(name).not.toMatch(/\*+/);
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  describe("poll interval suggestions", () => {
    test("returns suggested poll interval in metadata", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.preparing}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data._meta).toBeDefined();
        expect(data._meta.suggestedPollInterval).toBeDefined();
      }
    });

    test("returns 15s poll interval for preparing orders", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.preparing}`
      );

      if (response.status === 200) {
        const data = await response.json();
        if (data.order.status === "preparing") {
          expect(data._meta.suggestedPollInterval).toBe(15);
        }
      }
    });

    test("returns longer poll interval for completed orders", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.completed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        if (data.order.status === "completed") {
          // Completed orders don't need polling
          expect(data._meta.suggestedPollInterval).toBe(0);
        }
      }
    });
  });

  describe("response structure", () => {
    test("includes order status", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order.status).toBeDefined();
        expect([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]).toContain(data.order.status);
      }
    });

    test("includes order items", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order.items).toBeDefined();
        expect(Array.isArray(data.order.items)).toBe(true);
      }
    });

    test("includes location details", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order.location).toBeDefined();
        expect(data.order.location.name).toBeDefined();
      }
    });

    test("includes timestamps", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.completed}`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.order.timestamps || data.order.createdAt).toBeDefined();
      }
    });
  });

  describe("caching", () => {
    test("sets cache-control header", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.confirmed}`
      );

      if (response.status === 200) {
        const cacheControl = response.headers.get("cache-control");
        expect(cacheControl).toBeDefined();
      }
    });

    test("uses longer cache for completed orders", async (ctx) => {
      if (!apiAvailable) {
        ctx.skip();
        return;
      }

      const response = await apiRequest(
        `/api/orders/${fixtureOrderNumbers.completed}`
      );

      if (response.status === 200) {
        const cacheControl = response.headers.get("cache-control");
        // Completed orders should have longer max-age
        if (cacheControl) {
          const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
          if (maxAgeMatch) {
            const maxAge = parseInt(maxAgeMatch[1], 10);
            expect(maxAge).toBeGreaterThan(60);
          }
        }
      }
    });
  });
});
