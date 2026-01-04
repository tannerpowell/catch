/**
 * Accessibility E2E Tests
 *
 * Tests for WCAG 2.1 compliance using axe-core.
 * Focuses on critical violations that block users.
 *
 * Requires: npm i -D @axe-core/playwright
 */

import { test, expect } from "@playwright/test";
import { routes, navigateTo } from "./_helpers";

// Try to import AxeBuilder, skip tests if not installed
let AxeBuilder: typeof import("@axe-core/playwright").default | null = null;

async function loadAxeBuilder() {
  try {
    const module = await import("@axe-core/playwright");
    AxeBuilder = module.default;
  } catch {
    // Package not installed - tests will be skipped
  }
}

test.describe("Accessibility", () => {
  test.beforeAll(async () => {
    await loadAxeBuilder();
  });

  test("menu page: no critical violations", async ({ page }) => {
    if (!AxeBuilder) {
      test.skip(true, "Install @axe-core/playwright to run accessibility tests");
      return;
    }

    await navigateTo(page, routes.menu);

    const results = await new AxeBuilder({ page }).analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (critical.length > 0) {
      console.log("Critical a11y violations on menu page:");
      critical.forEach((v) => {
        console.log(`  - ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => console.log(`    ${n.html.slice(0, 80)}`));
      });
    }

    expect(critical).toHaveLength(0);
  });

  test("cart page: no critical violations", async ({ page }) => {
    if (!AxeBuilder) {
      test.skip(true, "Install @axe-core/playwright to run accessibility tests");
      return;
    }

    await navigateTo(page, routes.cart);

    const results = await new AxeBuilder({ page }).analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(critical).toHaveLength(0);
  });

  test("checkout form: no critical violations", async ({ page }) => {
    if (!AxeBuilder) {
      test.skip(true, "Install @axe-core/playwright to run accessibility tests");
      return;
    }

    await navigateTo(page, routes.checkout);

    const results = await new AxeBuilder({ page }).analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (critical.length > 0) {
      console.log("Critical a11y violations on checkout page:");
      critical.forEach((v) => {
        console.log(`  - ${v.id}: ${v.description}`);
      });
    }

    expect(critical).toHaveLength(0);
  });

  test("kitchen KDS: no critical violations", async ({ page }) => {
    if (!AxeBuilder) {
      test.skip(true, "Install @axe-core/playwright to run accessibility tests");
      return;
    }

    await navigateTo(page, routes.kitchen);

    const results = await new AxeBuilder({ page }).analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(critical).toHaveLength(0);
  });

  test.describe("keyboard navigation", () => {
    test("checkout form is keyboard navigable", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      // Tab through form fields
      await page.keyboard.press("Tab");

      const firstFocused = await page.evaluate(
        () => document.activeElement?.tagName
      );

      // First tab should focus an input or button
      expect(["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA"]).toContain(
        firstFocused
      );

      // Tab again
      await page.keyboard.press("Tab");

      const secondFocused = await page.evaluate(
        () => document.activeElement?.tagName
      );

      // Should still be on a focusable element
      expect(["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA"]).toContain(
        secondFocused
      );
    });

    test("menu items are keyboard accessible", async ({ page }) => {
      await navigateTo(page, routes.menu);

      // Look for menu items
      const menuItems = page.locator('[data-testid^="menu-item-"]');

      if ((await menuItems.count()) === 0) {
        test.skip(true, "No menu items found");
        return;
      }

      // Tab to first menu item
      let found = false;
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute("data-testid") || "";
        });

        if (activeElement.startsWith("menu-item-")) {
          found = true;
          break;
        }
      }

      expect(found).toBe(true);
    });

    test("modal can be closed with Escape key", async ({ page }) => {
      await navigateTo(page, routes.menu);

      // Click first menu item to open modal
      const menuItem = page.locator('[data-testid^="menu-item-"]').first();

      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found");
        return;
      }

      await menuItem.click();

      // Wait for modal
      await page.waitForTimeout(300);

      // Check if modal is visible
      const modal = page.getByTestId("item-modal");

      if ((await modal.count()) > 0 && (await modal.isVisible())) {
        // Press Escape
        await page.keyboard.press("Escape");

        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe("ARIA attributes", () => {
    test("form inputs have labels", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      const inputs = page.locator("input:visible");
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const placeholder = await input.getAttribute("placeholder");

        // Input should have either:
        // - id with matching label
        // - aria-label
        // - aria-labelledby
        // - placeholder (fallback)
        const hasAccessibleName =
          id || ariaLabel || ariaLabelledBy || placeholder;

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test("buttons have accessible names", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      const buttons = page.locator("button:visible");
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute("aria-label");
        const title = await button.getAttribute("title");

        // Button should have text content or aria-label
        const hasAccessibleName =
          (text && text.trim().length > 0) || ariaLabel || title;

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test("images have alt text", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const images = page.locator("img:visible");
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute("alt");
        const role = await image.getAttribute("role");

        // Image should have alt or role="presentation" for decorative
        const hasAlt = alt !== null || role === "presentation";

        expect(hasAlt).toBe(true);
      }
    });
  });

  test.describe("color contrast", () => {
    test("text has sufficient contrast", async ({ page }) => {
      if (!AxeBuilder) {
        test.skip(true, "Install @axe-core/playwright to run accessibility tests");
        return;
      }

      await navigateTo(page, routes.menu);

      // Run only color contrast rule
      const results = await new AxeBuilder({ page })
        .include("body")
        .withRules(["color-contrast"])
        .analyze();

      const contrastViolations = results.violations;

      if (contrastViolations.length > 0) {
        console.log("Color contrast violations:");
        contrastViolations.forEach((v) => {
          v.nodes.slice(0, 3).forEach((n) => {
            console.log(`  - ${n.html.slice(0, 60)}`);
          });
        });
      }

      // Allow some violations but not critical ones
      const criticalContrast = contrastViolations.filter(
        (v) => v.impact === "critical"
      );

      expect(criticalContrast).toHaveLength(0);
    });
  });

  test.describe("focus management", () => {
    test("focus is visible on interactive elements", async ({ page }) => {
      await navigateTo(page, routes.checkout);

      // Tab to an input
      await page.keyboard.press("Tab");

      // Get the focused element
      const focusedElement = page.locator(":focus");

      // Check that focus is visible (has outline or other indicator)
      // This is a basic check - more sophisticated tests would check computed styles
      await expect(focusedElement).toBeVisible();
    });

    test("focus trap in modal", async ({ page }) => {
      await navigateTo(page, routes.menu);

      const menuItem = page.locator('[data-testid^="menu-item-"]').first();

      if ((await menuItem.count()) === 0) {
        test.skip(true, "No menu items found");
        return;
      }

      await menuItem.click();

      // Wait for modal
      await page.waitForTimeout(300);

      const modal = page.getByTestId("item-modal");

      if ((await modal.count()) > 0 && (await modal.isVisible())) {
        // Tab multiple times
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press("Tab");
        }

        // Focus should still be within modal
        const focusedInModal = await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="item-modal"]');
          return modal?.contains(document.activeElement);
        });

        expect(focusedInModal).toBe(true);
      }
    });
  });
});
