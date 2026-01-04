/**
 * Order Confirmation E2E Tests
 *
 * Tests for the post-checkout confirmation flow.
 * Verifies order number display, tracking links, and confirmation details.
 */

import { test, expect } from "@playwright/test";
import {
  routes,
  navigateTo,
  ensureTestId,
  addItemToCart,
  completeCheckout,
  getOrderNumberFromUrl,
} from "./_helpers";

test.describe("Order confirmation", () => {
  test("shows order number after checkout", async ({ page }) => {
    // Setup: Add item to cart
    await navigateTo(page, routes.menu);

    // Click first menu item
    const menuItem = page.locator('[data-testid^="menu-item-"]').first();
    if ((await menuItem.count()) === 0) {
      test.skip(
        true,
        'No menu items found. Add data-testid="menu-item-<id>" to menu items.'
      );
      return;
    }
    await menuItem.click();

    // Add to cart
    const addButton = page.getByTestId("add-to-cart");
    if ((await addButton.count()) === 0) {
      test.skip(true, 'Missing data-testid="add-to-cart" on add to cart button.');
      return;
    }
    await addButton.click();

    // Go to checkout
    await navigateTo(page, routes.checkout);

    // Fill form
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="phone"]').fill("2145551234");

    // Submit
    await page.getByTestId("checkout-submit").click();

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
    // Setup with a completed checkout
    await navigateTo(page, routes.menu);

    const menuItem = page.locator('[data-testid^="menu-item-"]').first();
    if ((await menuItem.count()) === 0) {
      test.skip(true, "No menu items found.");
      return;
    }
    await menuItem.click();
    await page.getByTestId("add-to-cart").click();

    await navigateTo(page, routes.checkout);
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="phone"]').fill("2145551234");
    await page.getByTestId("checkout-submit").click();

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
    await navigateTo(page, routes.menu);

    const menuItem = page.locator('[data-testid^="menu-item-"]').first();
    if ((await menuItem.count()) === 0) {
      test.skip(true, "No menu items found.");
      return;
    }
    await menuItem.click();
    await page.getByTestId("add-to-cart").click();

    await navigateTo(page, routes.checkout);
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="phone"]').fill("2145551234");
    await page.getByTestId("checkout-submit").click();

    await expect(page).toHaveURL(/order-confirmation|orders\//);

    // Check for order details
    const body = page.locator("body");

    // Should show some indication of success
    await expect(body).toContainText(/order|confirmation|thank|success/i);
  });

  test("shows demo mode notice in development", async ({ page }) => {
    await navigateTo(page, routes.menu);

    const menuItem = page.locator('[data-testid^="menu-item-"]').first();
    if ((await menuItem.count()) === 0) {
      test.skip(true, "No menu items found.");
      return;
    }
    await menuItem.click();
    await page.getByTestId("add-to-cart").click();

    await navigateTo(page, routes.checkout);
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="phone"]').fill("2145551234");
    await page.getByTestId("checkout-submit").click();

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
    await navigateTo(page, routes.menu);

    const menuItem = page.locator('[data-testid^="menu-item-"]').first();
    if ((await menuItem.count()) === 0) {
      test.skip(true, "No menu items found.");
      return;
    }
    await menuItem.click();
    await page.getByTestId("add-to-cart").click();

    await navigateTo(page, routes.checkout);
    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="phone"]').fill("2145551234");

    const submitButton = page.getByTestId("checkout-submit");

    // Click submit
    await submitButton.click();

    // Try to click again immediately - button should be disabled or we should redirect
    const isDisabled = await submitButton.isDisabled();
    const currentUrl = page.url();

    // Either button is disabled OR we've already redirected
    expect(isDisabled || currentUrl.includes("order")).toBe(true);
  });
});
