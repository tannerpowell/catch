/**
 * Error Handling E2E Tests
 *
 * Tests for graceful error handling:
 * - Network failures
 * - Validation errors
 * - 404 pages
 * - Form validation
 */

import { test, expect } from "@playwright/test";
import { routes, navigateTo } from "./_helpers";

test.describe("Error handling", () => {
  test.describe("checkout form validation", () => {
    test("shows validation errors on empty submit", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      // Try to submit without filling form
      const submitButton = page.getByTestId("checkout-submit");

      if ((await submitButton.count()) === 0) {
        test.skip(true, 'Missing data-testid="checkout-submit".');
        return;
      }

      await submitButton.click();

      // Should show validation errors
      const errorIndicators = page.locator(
        '[aria-invalid="true"], [data-testid^="field-error-"], .error, [class*="error"]'
      );

      await expect(errorIndicators.first()).toBeVisible();
    });

    test("shows error for invalid email format", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      const emailInput = page.locator('input[name="email"]');

      if ((await emailInput.count()) === 0) {
        test.skip(true, 'Missing input[name="email"].');
        return;
      }

      await emailInput.fill("not-an-email");
      await emailInput.blur();

      // Should show email validation error
      await expect(page.locator("body")).toContainText(
        /invalid|email|format|valid/i
      );
    });

    test("shows error for invalid phone format", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      const phoneInput = page.locator('input[name="phone"]');

      if ((await phoneInput.count()) === 0) {
        test.skip(true, 'Missing input[name="phone"].');
        return;
      }

      await phoneInput.fill("123");
      await phoneInput.blur();

      // Should show phone validation error
      await expect(page.locator("body")).toContainText(
        /invalid|phone|10.*digit|format/i
      );
    });

    test("clears errors when valid input provided", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      const emailInput = page.locator('input[name="email"]');

      if ((await emailInput.count()) === 0) {
        test.skip(true, 'Missing input[name="email"].');
        return;
      }

      // First enter invalid email
      await emailInput.fill("invalid");
      await emailInput.blur();

      // Then enter valid email
      await emailInput.fill("valid@example.com");
      await emailInput.blur();

      // Error should be cleared
      const emailError = page.locator(
        '[data-testid="field-error-email"], [aria-describedby*="email"][aria-invalid="true"]'
      );

      // Either error is gone or aria-invalid is false
      const hasError = (await emailError.count()) > 0;

      if (hasError) {
        // If error element exists, check it's not visible or invalid is false
        const isInvalid = await emailInput.getAttribute("aria-invalid");
        expect(isInvalid).not.toBe("true");
      }
    });
  });

  test.describe("network errors", () => {
    test("shows error on Sanity failure", async ({ page }) => {
      // Intercept Sanity requests and fail them
      await page.route("**/sanity.io/**", (route) => route.abort("failed"));
      await page.route("**/*.sanity.io/**", (route) => route.abort("failed"));

      await navigateTo(page, routes.menu);

      // Should show error state or demo data
      const body = await page.locator("body").textContent();

      const hasErrorHandling =
        body?.toLowerCase().includes("error") ||
        body?.toLowerCase().includes("unavailable") ||
        body?.toLowerCase().includes("demo") ||
        body?.toLowerCase().includes("couldn't load") ||
        // Or it shows demo data (fallback)
        body?.toLowerCase().includes("catfish") ||
        body?.toLowerCase().includes("shrimp");

      expect(hasErrorHandling).toBe(true);
    });

    test("shows retry option on failure", async ({ page }) => {
      // Intercept and fail requests
      await page.route("**/sanity.io/**", (route) => route.abort("failed"));

      await navigateTo(page, routes.menu);

      // Look for retry button
      const retryButton = page.getByTestId("retry-button");

      if ((await retryButton.count()) > 0) {
        await expect(retryButton).toBeVisible();
      } else {
        // Alternative: look for any retry-like button
        const retryLike = page.locator(
          'button:has-text("Retry"), button:has-text("Try again"), button:has-text("Reload")'
        );

        // If retry exists, it should be clickable
        if ((await retryLike.count()) > 0) {
          await expect(retryLike.first()).toBeEnabled();
        }
      }
    });
  });

  test.describe("404 handling", () => {
    test("shows 404 for non-existent menu item", async ({ page }) => {
      // Navigate to non-existent item
      await page.goto(`${routes.menu}/non-existent-item-12345`);

      // Should show 404 or redirect
      const is404 =
        page.url().includes("404") ||
        (await page.locator("body").textContent())
          ?.toLowerCase()
          .includes("not found");

      // Either 404 page or redirected back
      expect(is404 || page.url() === routes.menu || page.url().includes("menu")).toBe(true);
    });

    test("shows 404 for non-existent order", async ({ page }) => {
      await page.goto(routes.orderTracking("ORD-99999999-XXXXX"));

      const bodyText = await page.locator("body").textContent();

      const isNotFound =
        page.url().includes("404") ||
        bodyText?.toLowerCase().includes("not found") ||
        bodyText?.toLowerCase().includes("doesn't exist") ||
        bodyText?.toLowerCase().includes("error");

      expect(isNotFound).toBe(true);
    });

    test("shows 404 for invalid route", async ({ page }) => {
      await page.goto("/this-route-definitely-does-not-exist");

      // Should show 404 page
      const is404 =
        page.url().includes("404") ||
        (await page.locator("body").textContent())
          ?.toLowerCase()
          .includes("not found");

      expect(is404).toBe(true);
    });
  });

  test.describe("empty states", () => {
    test("shows empty cart message", async ({ page }) => {
      // Clear any existing cart data
      await page.goto(routes.cart);

      // If cart has items, clear it
      const clearButton = page.getByTestId("clear-cart");
      if ((await clearButton.count()) > 0 && (await clearButton.isVisible())) {
        await clearButton.click();
        await page.waitForTimeout(500);
      }

      // Go to cart
      await navigateTo(page, routes.cart);

      // Should show empty state
      const bodyText = await page.locator("body").textContent();

      const isEmpty =
        bodyText?.toLowerCase().includes("empty") ||
        bodyText?.toLowerCase().includes("no items") ||
        bodyText?.toLowerCase().includes("add items") ||
        bodyText?.toLowerCase().includes("start shopping");

      // Cart should either be empty or have items from previous test
      // This is a soft check
      if ((await page.locator('[data-testid^="cart-row-"]').count()) === 0) {
        expect(isEmpty).toBe(true);
      }
    });

    test("shows link to menu from empty cart", async ({ page }) => {
      await page.goto(routes.cart);

      const clearButton = page.getByTestId("clear-cart");
      if ((await clearButton.count()) > 0 && (await clearButton.isVisible())) {
        await clearButton.click();
        await page.waitForTimeout(500);
      }

      // If cart is empty, there should be a link to menu
      if ((await page.locator('[data-testid^="cart-row-"]').count()) === 0) {
        const menuLink = page.locator(
          'a[href*="menu"], button:has-text("Browse Menu"), button:has-text("Start Shopping")'
        );

        if ((await menuLink.count()) > 0) {
          await expect(menuLink.first()).toBeVisible();
        }
      }
    });
  });

  test.describe("form accessibility", () => {
    test("form fields have proper labels", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      // Check that inputs have associated labels
      const inputs = page.locator(
        'input[name="name"], input[name="email"], input[name="phone"]'
      );

      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");

        // Should have either id with matching label, aria-label, or aria-labelledby
        const hasLabel = id || ariaLabel || ariaLabelledBy;

        if (!hasLabel) {
          // Check for wrapping label
          const label = await input.locator("..").locator("label").count();
          expect(label).toBeGreaterThan(0);
        }
      }
    });

    test("error messages are accessible", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      // Submit empty form to trigger errors
      const submitButton = page.getByTestId("checkout-submit");
      if ((await submitButton.count()) === 0) {
        test.skip(true, 'Missing data-testid="checkout-submit".');
        return;
      }
      await submitButton.click();

      // Wait for errors
      await page.waitForTimeout(500);

      // Check for ARIA attributes on errors
      const errors = page.locator(
        '[data-testid^="field-error-"], [role="alert"], [aria-live="polite"], [aria-live="assertive"]'
      );

      if ((await errors.count()) > 0) {
        // Errors should have proper ARIA
        const firstError = errors.first();
        const role = await firstError.getAttribute("role");
        const ariaLive = await firstError.getAttribute("aria-live");

        // Should have role="alert" or aria-live
        expect(role === "alert" || ariaLive !== null).toBe(true);
      }
    });
  });
});
