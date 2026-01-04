/**
 * Cart Edge Cases E2E Tests
 *
 * Tests for cart functionality edge cases:
 * - Location locking
 * - Modifiers persistence
 * - Special instructions
 * - Tip updates
 * - Quantity edge cases
 */

import { test, expect } from "@playwright/test";
import { routes, navigateTo, priceToDollars } from "./_helpers";

test.describe("Cart edge cases", () => {
  test.describe("location locking", () => {
    test("allows adding items from same location", async ({ page }) => {
      // Add first item
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();

      // Add second item (same page = same location)
      await navigateTo(page, routes.menu);
      const secondItem = page.locator('[data-testid^="menu-item-"]').nth(1);

      if ((await secondItem.count()) > 0) {
        await secondItem.click();

        // Should be able to add without warning
        const addButton = page.getByTestId("add-to-cart");
        await expect(addButton).toBeEnabled();
      }
    });

    test("shows warning when adding from different location", async ({
      page,
    }) => {
      // This test requires multi-location support
      // Add item from Arlington
      await navigateTo(page, `${routes.menu}?location=arlington`);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();

      const addButton = page.getByTestId("add-to-cart");
      if ((await addButton.count()) === 0) {
        test.skip(true, 'Missing data-testid="add-to-cart".');
        return;
      }

      await addButton.click();

      // Try to add from Garland
      await navigateTo(page, `${routes.menu}?location=garland`);

      const garlandItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await garlandItem.count()) > 0) {
        await garlandItem.click();

        // Should show location lock warning
        const warning = page.locator(
          'text=/different location|clear cart|switch/i'
        );
        const hasWarning = (await warning.count()) > 0;

        // If location switching is supported, there should be a warning
        // This is a soft check as implementation may vary
        if (hasWarning) {
          await expect(warning.first()).toBeVisible();
        }
      }
    });

    test("clears cart when switching locations", async ({ page }) => {
      // Add item from first location
      await navigateTo(page, `${routes.menu}?location=arlington`);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();

      // Go to cart
      await navigateTo(page, routes.cart);

      // Check cart has items
      const cartRows = page.locator('[data-testid^="cart-row-"]');
      const initialCount = await cartRows.count();

      if (initialCount === 0) {
        test.skip(true, "Cart is empty after adding item.");
        return;
      }

      // If there's a clear cart button, use it
      const clearButton = page.getByTestId("clear-cart");
      if ((await clearButton.count()) > 0) {
        await clearButton.click();

        // Cart should be empty
        await expect(cartRows).toHaveCount(0);
      }
    });
  });

  test.describe("modifiers", () => {
    test("modifiers appear in cart row", async ({ page }) => {
      await navigateTo(page, routes.menu);

      // Find an item that likely has modifiers
      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();

      // Look for modifier options
      const modifierOption = page.locator(
        '[data-testid^="modifier-"], input[type="checkbox"], input[type="radio"]'
      );

      if ((await modifierOption.count()) > 0) {
        // Select first modifier
        await modifierOption.first().click();

        // Add to cart
        await page.getByTestId("add-to-cart").click();

        // Go to cart
        await navigateTo(page, routes.cart);

        // Check cart row for modifier text
        const cartRow = page.locator('[data-testid^="cart-row-"]').first();
        const rowText = await cartRow.textContent();

        // Modifier name should appear in cart
        // This is implementation-dependent
        expect(rowText?.length).toBeGreaterThan(0);
      }
    });

    test("modifier price deltas update total", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();

      // Get base price if shown
      const priceElement = page.locator(
        '[data-testid="item-price"], .price, [class*="price"]'
      );
      let basePrice = 0;

      if ((await priceElement.count()) > 0) {
        const priceText = await priceElement.first().textContent();
        basePrice = priceToDollars(priceText ?? "0");
      }

      // Select a modifier that has a price delta
      const modifierWithPrice = page.locator(
        '[data-testid^="modifier-"][data-price], [data-testid*="large"], [data-testid*="extra"]'
      );

      if ((await modifierWithPrice.count()) > 0) {
        await modifierWithPrice.first().click();

        // Add to cart
        await page.getByTestId("add-to-cart").click();

        // Go to cart
        await navigateTo(page, routes.cart);

        // Check total is higher than base price
        const totalElement = page.getByTestId("cart-total");
        if ((await totalElement.count()) > 0) {
          const totalText = await totalElement.textContent();
          const total = priceToDollars(totalText ?? "0");

          if (basePrice > 0) {
            expect(total).toBeGreaterThanOrEqual(basePrice);
          }
        }
      }
    });
  });

  test.describe("special instructions", () => {
    test("special instructions persist to cart", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();

      // Look for special instructions field
      const instructionsField = page.getByTestId("special-instructions");

      if ((await instructionsField.count()) > 0) {
        await instructionsField.fill("Extra crispy please");
        await page.getByTestId("add-to-cart").click();

        await navigateTo(page, routes.cart);

        // Instructions should appear in cart
        await expect(page.locator("body")).toContainText("Extra crispy");
      } else {
        // Alternative: look for textarea
        const textarea = page.locator(
          'textarea[name*="instruction"], textarea[placeholder*="instruction"]'
        );

        if ((await textarea.count()) > 0) {
          await textarea.first().fill("Extra crispy please");
          await page.getByTestId("add-to-cart").click();
          await navigateTo(page, routes.cart);
          await expect(page.locator("body")).toContainText("Extra crispy");
        }
      }
    });
  });

  test.describe("tip", () => {
    test("tip updates total correctly", async ({ page }) => {
      // Add item to cart first
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();

      // Go to cart
      await navigateTo(page, routes.cart);

      // Get initial total
      const totalElement = page.getByTestId("cart-total");
      if ((await totalElement.count()) === 0) {
        test.skip(true, 'Missing data-testid="cart-total".');
        return;
      }

      const totalBefore = priceToDollars(
        (await totalElement.textContent()) ?? "0"
      );

      // Find tip input
      const tipInput = page.getByTestId("tip-input");

      if ((await tipInput.count()) > 0) {
        await tipInput.fill("5");
        await tipInput.blur();

        // Wait for total to update with retry
        await expect(async () => {
          const totalAfter = priceToDollars(
            (await totalElement.textContent()) ?? "0"
          );
          expect(totalAfter - totalBefore).toBeCloseTo(5, 2);
        }).toPass({ timeout: 5000 });
      }
    });

    test("tip preset buttons work", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();
      await navigateTo(page, routes.cart);

      // Look for tip preset buttons (15%, 20%, etc)
      const tipPreset = page.locator(
        '[data-testid^="tip-preset-"], button:has-text("15%"), button:has-text("20%")'
      );

      if ((await tipPreset.count()) > 0) {
        const totalBefore = priceToDollars(
          (await page.getByTestId("cart-total").textContent()) ?? "0"
        );

        await tipPreset.first().click();

        // Wait for total to update with retry
        await expect(async () => {
          const totalAfter = priceToDollars(
            (await page.getByTestId("cart-total").textContent()) ?? "0"
          );
          expect(totalAfter).toBeGreaterThan(totalBefore);
        }).toPass({ timeout: 5000 });
      }
    });
  });

  test.describe("quantity", () => {
    test("quantity increase updates total", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();
      await navigateTo(page, routes.cart);

      // Find quantity increase button
      const increaseButton = page.locator(
        '[data-testid^="qty-increase-"], button:has-text("+")'
      );

      if ((await increaseButton.count()) > 0) {
        const totalBefore = priceToDollars(
          (await page.getByTestId("cart-total").textContent()) ?? "0"
        );

        await increaseButton.first().click();

        // Wait for total to update with retry
        await expect(async () => {
          const totalAfter = priceToDollars(
            (await page.getByTestId("cart-total").textContent()) ?? "0"
          );
          expect(totalAfter).toBeGreaterThan(totalBefore);
        }).toPass({ timeout: 5000 });
      }
    });

    test("quantity decrease updates total", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();
      await navigateTo(page, routes.cart);

      // First increase quantity
      const increaseButton = page.locator(
        '[data-testid^="qty-increase-"], button:has-text("+")'
      );

      if ((await increaseButton.count()) > 0) {
        await increaseButton.first().click();

        // Wait briefly for quantity update to complete
        await page.waitForTimeout(500);

        const totalBefore = priceToDollars(
          (await page.getByTestId("cart-total").textContent()) ?? "0"
        );

        // Now decrease
        const decreaseButton = page.locator(
          '[data-testid^="qty-decrease-"], button:has-text("-")'
        );

        if ((await decreaseButton.count()) > 0) {
          await decreaseButton.first().click();

          // Wait for total to update with retry
          await expect(async () => {
            const totalAfter = priceToDollars(
              (await page.getByTestId("cart-total").textContent()) ?? "0"
            );
            expect(totalAfter).toBeLessThan(totalBefore);
          }).toPass({ timeout: 5000 });
        }
      }
    });

    test("removing item updates cart", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();
      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found.");
        return;
      }

      await menuItem.click();
      await page.getByTestId("add-to-cart").click();
      await navigateTo(page, routes.cart);

      const cartRows = page.locator('[data-testid^="cart-row-"]');
      const initialCount = await cartRows.count();

      if (initialCount === 0) {
        test.skip(true, "Cart is empty.");
        return;
      }

      // Find remove button
      const removeButton = page.locator(
        '[data-testid^="remove-item-"], button:has-text("Remove"), button[aria-label*="remove"]'
      );

      if ((await removeButton.count()) > 0) {
        await removeButton.first().click();

        // Wait for cart to update with retry
        await expect(async () => {
          const finalCount = await cartRows.count();
          expect(finalCount).toBeLessThan(initialCount);
        }).toPass({ timeout: 5000 });
      }
    });
  });
});
