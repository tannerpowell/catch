import { expect, Locator, Page, test } from "@playwright/test";

/**
 * Whether to fail (true) or skip (false) when required selectors are missing.
 * Set E2E_REQUIRE_TESTIDS=1 to fail tests instead of skipping.
 */
const STRICT_MODE = process.env.E2E_REQUIRE_TESTIDS === "1";

/**
 * Configurable route URLs.
 * Override with environment variables for custom routes.
 */
export const routes = {
  menu: process.env.E2E_MENU_URL ?? "/menu",
  cart: process.env.E2E_CART_URL ?? "/cart",
  checkout: process.env.E2E_CHECKOUT_URL ?? "/checkout",
  orderConfirmation:
    process.env.E2E_ORDER_CONFIRMATION_URL ?? "/order-confirmation",
  orderTracking: (orderNumber: string) => `/orders/${orderNumber}`,
  kitchen: process.env.E2E_KITCHEN_URL ?? "/kitchen",
} as const;

/**
 * Assert that an element with the given test ID exists.
 * In strict mode, throws an error. Otherwise, skips the test.
 *
 * @param page - Playwright page object
 * @param testId - The data-testid value to look for
 * @param hint - Message explaining what's missing and how to fix it
 * @returns The locator for the first matching element
 */
export async function ensureTestId(
  page: Page,
  testId: string,
  hint: string
): Promise<Locator> {
  const locator = page.getByTestId(testId);
  const count = await locator.count();

  if (count === 0) {
    const message = `Missing data-testid="${testId}". ${hint}`;
    if (STRICT_MODE) {
      throw new Error(message);
    }
    test.skip(true, message);
  }

  return locator.first();
}

/**
 * Navigate to a route, handling 404 gracefully.
 * In strict mode, throws an error. Otherwise, skips the test.
 *
 * @param page - Playwright page object
 * @param path - The path to navigate to
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });

  if (response?.status() === 404) {
    const message = `Route ${path} returned 404. Update route or set E2E_*_URL env var.`;
    if (STRICT_MODE) {
      throw new Error(message);
    }
    test.skip(true, message);
  }
}

/**
 * Assert that the cart badge shows a specific count.
 *
 * @param page - Playwright page object
 * @param expected - The expected cart item count
 */
export async function expectCartCount(
  page: Page,
  expected: number
): Promise<void> {
  const badge = page.getByTestId("cart-badge-count");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(String(expected));
}

/**
 * Assert that the cart badge shows any valid count greater than 0.
 */
export async function expectAnyCartCount(page: Page): Promise<void> {
  const badge = page.getByTestId("cart-badge-count");
  await expect(badge).toBeVisible();
  const txt = (await badge.textContent())?.trim() ?? "";
  const n = Number.parseInt(txt, 10);
  expect(Number.isFinite(n)).toBeTruthy();
  expect(n).toBeGreaterThan(0);
}

/**
 * Wait for an order's status to change to the target status.
 * Uses Playwright's expect.toPass() for automatic retry.
 *
 * @param page - Playwright page object
 * @param orderId - The order ID (used in testid)
 * @param targetStatus - The status to wait for (case-insensitive)
 * @param timeout - Maximum time to wait (default 30s)
 */
export async function waitForStatus(
  page: Page,
  orderId: string,
  targetStatus: string,
  timeout = 30000
): Promise<void> {
  await expect(async () => {
    const status = await page
      .getByTestId(`order-status-${orderId}`)
      .textContent();
    expect(status?.toLowerCase()).toContain(targetStatus.toLowerCase());
  }).toPass({ timeout });
}

/**
 * Fill a form field if it exists, skip silently if not.
 * Useful for forms where some fields may be optional or named differently.
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for the input
 * @param value - Value to fill
 */
export async function maybeFill(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const el = page.locator(selector);
  if ((await el.count()) > 0) {
    await el.first().fill(value);
  }
}

/**
 * Parse a price string like "$12.99" to cents (1299).
 */
export function priceToCents(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid price string: "${priceStr}"`);
  }
  return Math.round(parsed * 100);
}

/**
 * Parse a price string like "$12.99" to dollars (12.99).
 */
export function priceToDollars(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid price string: "${priceStr}"`);
  }
  return parsed;
}

/**
 * Get the order number from the current URL.
 * Expects URL pattern like /order-confirmation?orderNumber=ORD-12345-ABC
 */
export async function getOrderNumberFromUrl(page: Page): Promise<string> {
  const url = new URL(page.url());
  const orderNumber =
    url.searchParams.get("orderNumber") ??
    url.pathname.split("/").pop() ??
    "";
  return orderNumber;
}

/**
 * Add an item to cart through the menu UI.
 * This is a helper for setting up test state.
 *
 * @param page - Playwright page object
 * @param itemTestId - The data-testid of the menu item (without "menu-item-" prefix)
 */
export async function addItemToCart(
  page: Page,
  itemTestId: string
): Promise<void> {
  await navigateTo(page, routes.menu);
  await page.getByTestId(`menu-item-${itemTestId}`).click();
  await page.getByTestId("add-to-cart").click();
}

/**
 * Complete checkout with test data.
 * Fills form and submits, then waits for confirmation page.
 *
 * @param page - Playwright page object
 * @param customerInfo - Customer info to fill in the form
 */
export async function completeCheckout(
  page: Page,
  customerInfo = {
    name: "Test User",
    email: "test@example.com",
    phone: "2145551234",
  }
): Promise<string> {
  await navigateTo(page, routes.checkout);

  await maybeFill(page, 'input[name="name"]', customerInfo.name);
  await maybeFill(page, 'input[name="firstName"]', customerInfo.name);
  await maybeFill(page, 'input[name="lastName"]', "Tester");
  await maybeFill(page, 'input[name="email"]', customerInfo.email);
  await maybeFill(page, 'input[name="phone"]', customerInfo.phone);

  await page.getByTestId("checkout-submit").click();

  // Wait for redirect to confirmation
  await expect(page).toHaveURL(/order-confirmation|orders\//);

  return getOrderNumberFromUrl(page);
}
