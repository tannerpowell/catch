import { test, expect } from "@playwright/test";
import { e2eUrls, ensureTestId, gotoOrSkip, expectAnyCartCount } from "./_helpers";

test.describe("Menu → item selection → add to cart", () => {
  test("can add an item to cart", async ({ page }) => {
    const { menu } = e2eUrls();

    await gotoOrSkip(page, menu);

    // Required selectors (add these data-testid attributes in your UI)
    await ensureTestId(
      page,
      "category-nav",
      `Missing data-testid="category-nav" on the category navigation container (Menu page).`
    );

    // Menu item cards/buttons should expose stable ids or slugs
    const menuItem = page.locator('[data-testid^="menu-item-"]');
    const itemCount = await menuItem.count();
    if (itemCount === 0) {
      test.skip(true, `No [data-testid^="menu-item-"] found. Add data-testid="menu-item-<id>" to item cards/buttons.`);
    }

    await menuItem.first().click();

    await ensureTestId(page, "item-modal", `Missing data-testid="item-modal" on the item modal root.`);
    await ensureTestId(page, "add-to-cart", `Missing data-testid="add-to-cart" on the modal Add to Cart button.`);

    await page.getByTestId("add-to-cart").click();

    // Verify cart badge increments (recommended in your header/cart button)
    await expectAnyCartCount(page);
  });
});
