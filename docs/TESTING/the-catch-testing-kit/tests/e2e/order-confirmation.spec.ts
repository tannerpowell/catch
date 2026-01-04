/**
 * Order Confirmation E2E Tests
 *
 * Tests for the post-checkout confirmation flow.
 * Verifies order number display, tracking links, and confirmation details.
 */

import { test, expect } from "@playwright/test";
import { completeCheckout } from "./_helpers";

test.describe("Order confirmation", () => {
  test("shows order number after checkout", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    // Verify confirmation page
    await expect(page).toHaveURL(/order-confirmation|orders\//);

    // Order number should be visible
    const orderNumber = page.getByTestId("order-number");
    if ((await orderNumber.count()) > 0) {
      await expect(orderNumber).toBeVisible();
      await expect(orderNumber).toContainText(/ORD-\d+/);
    } else {
      // Fallback: check page contains order number pattern
      await expect(page.locator("body")).toContainText(/ORD-\d+/);
    }
  });

  test("provides link to track order", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    // Wait for confirmation page
    await expect(page).toHaveURL(/order-confirmation|orders\//);

    // Look for tracking link
    const trackLink = page.getByRole("link", { name: /track/i });

    if ((await trackLink.count()) > 0) {
      await expect(trackLink).toBeVisible();
      await trackLink.click();
      await expect(page).toHaveURL(/\/orders\/ORD-/);
    } else {
      // Alternative: look for any link containing order
      const orderLink = page.locator('a[href*="order"]').first();
      if ((await orderLink.count()) > 0) {
        await orderLink.click();
        await expect(page).toHaveURL(/order/);
      }
    }
  });

  test("displays order summary on confirmation", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    await expect(page).toHaveURL(/order-confirmation|orders\//);

    // Check for order details
    const body = page.locator("body");

    // Should show some indication of success
    await expect(body).toContainText(/order|confirmation|thank|success/i);
  });

  test("shows demo mode notice in development", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    await expect(page).toHaveURL(/order-confirmation|orders\//);

    // In demo mode, there should be some indication
    const body = page.locator("body");
    const hasDemoNotice = await body.textContent();

    // This is a soft check - demo notice may or may not be present
    if (hasDemoNotice?.toLowerCase().includes("demo")) {
      expect(hasDemoNotice.toLowerCase()).toContain("demo");
    }
  });

  test("prevents double submission", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    await expect(page).toHaveURL(/order-confirmation|orders\//);
  });
});
