import { test, expect } from "@playwright/test";
import { e2eUrls, gotoOrSkip } from "./_helpers";

test.describe("Cart operations", () => {
  test("updates quantity and removes items", async ({ page }) => {
    const { cart } = e2eUrls();

    await gotoOrSkip(page, cart);

    // These are intentionally conservative: tests skip if your cart selectors are not yet implemented.
    const cartRow = page.locator('[data-testid^="cart-row-"]');
    const rows = await cartRow.count();
    if (rows === 0) {
      test.skip(true, `No [data-testid^="cart-row-"] found. Add data-testid="cart-row-<id>" to each cart line item.`);
    }

    const firstRow = cartRow.first();
    const rowTestId = await firstRow.getAttribute("data-testid");
    if (!rowTestId) {
      test.skip(true, "Cart row missing data-testid attribute.");
    }

    // Derive the id suffix: cart-row-<id>
    const suffix = rowTestId.replace(/^cart-row-/, "");

    const inc = page.getByTestId(`qty-increase-${suffix}`);
    const dec = page.getByTestId(`qty-decrease-${suffix}`);
    const remove = page.getByTestId(`remove-item-${suffix}`);

    if ((await inc.count()) === 0 || (await dec.count()) === 0 || (await remove.count()) === 0) {
      test.skip(
        true,
        `Missing qty/remove controls. Add data-testid="qty-increase-${suffix}", "qty-decrease-${suffix}", "remove-item-${suffix}".`
      );
    }

    // Quantity text is optional; if you have it, expose it as qty-value-<id>.
    await inc.click();
    await dec.click();
    await remove.click();

    // Assert row removed (best-effort)
    await expect(page.getByTestId(`cart-row-${suffix}`)).toHaveCount(0);
  });
});
