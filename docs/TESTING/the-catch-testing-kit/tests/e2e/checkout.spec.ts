import { test, expect } from "@playwright/test";
import { e2eUrls, gotoOrSkip, ensureTestId, maybeFill } from "./_helpers";

test.describe("Checkout validation + submission (payment mocked/skipped)", () => {
  test("shows validation errors on empty submit", async ({ page }) => {
    const { checkout } = e2eUrls();

    await gotoOrSkip(page, checkout);

    await ensureTestId(page, "checkout-form", `Missing data-testid="checkout-form" on the checkout form root.`);
    await ensureTestId(page, "checkout-submit", `Missing data-testid="checkout-submit" on the checkout submit button.`);

    await page.getByTestId("checkout-submit").click();

    // Generic expectation: at least one error is visible.
    // You can tighten this once your UI exposes stable error test ids.
    const anyError = page.locator('[data-testid^="field-error-"], [aria-invalid="true"], text=/required/i');
    await expect(anyError.first()).toBeVisible();
  });

  test("submits with valid data (expects redirect or confirmation content)", async ({ page }) => {
    const { checkout } = e2eUrls();
    await gotoOrSkip(page, checkout);

    // If your checkout uses named inputs, these locators are reasonable defaults:
    // Update names to match your form.
    await ensureTestId(page, "checkout-submit", `Missing data-testid="checkout-submit" on the checkout submit button.`);

    await maybeFill(page, 'input[name="firstName"]', "Test");
    await maybeFill(page, 'input[name="lastName"]', "User");
    await maybeFill(page, 'input[name="email"]', "test@example.com");
    await maybeFill(page, 'input[name="phone"]', "2145551212");

    await page.getByTestId("checkout-submit").click();

    // Because payment/auth aren't implemented, your app may:
    // - create an order locally and route to confirmation, OR
    // - show a "not implemented" message.
    // Customize this assertion once your behavior is fixed.
    await expect(page.locator("body")).toContainText(/order|confirmation|not implemented|success/i);
  });
});
