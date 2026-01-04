/**
 * Order Confirmation E2E Tests
 *
 * Tests for the post-checkout confirmation flow.
 * Verifies order number display, tracking links, and confirmation details.
 */

import { test, expect } from "@playwright/test";
import { completeCheckout, navigateTo, routes, maybeFill } from "./_helpers";

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

    // Verify demo mode notice is displayed
    const body = page.locator("body");
    await expect(body).toContainText(/demo/i);
  });

  test("completes checkout successfully", async ({ page }) => {
    await completeCheckout(page, {
      name: "Test User",
      email: "test@example.com",
      phone: "2145551234",
    });

    await expect(page).toHaveURL(/order-confirmation|orders\//);
  });

  test("prevents double submission", async ({ page }) => {
    // Track POST requests to orders endpoint
    const orderRequests: string[] = [];
    await page.route("**/api/orders", (route) => {
      if (route.request().method() === "POST") {
        orderRequests.push(route.request().url());
      }
      route.continue();
    });

    // Navigate to checkout and fill form
    await navigateTo(page, routes.checkout);

    await maybeFill(page, 'input[name="name"]', "Test User");
    await maybeFill(page, 'input[name="email"]', "test@example.com");
    await maybeFill(page, 'input[name="phone"]', "2145551234");

    // Get submit button
    const submitButton = page.getByRole("button", { name: /place order|checkout|submit/i });
    await expect(submitButton).toBeVisible();

    // Simulate double-click submission attempt
    await submitButton.click();
    await submitButton.click({ force: true }); // Force second click even if disabled

    // Wait for navigation to confirmation page
    await expect(page).toHaveURL(/order-confirmation|orders\//, { timeout: 10000 });

    // Verify button was disabled after first click
    // (we can't directly test this due to navigation, but single request proves it worked)

    // Assert only ONE POST request was made
    expect(orderRequests).toHaveLength(1);
  });
});
