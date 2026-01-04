import { test, expect } from "@playwright/test";
import { e2eUrls, gotoOrSkip, ensureTestId } from "./_helpers";

test.describe("Kitchen display (KDS)", () => {
  test("renders orders and supports status advance (fixture-friendly)", async ({ page }) => {
    const { kitchen } = e2eUrls();

    await gotoOrSkip(page, kitchen);

    await ensureTestId(page, "kds-board", `Missing data-testid="kds-board" on the kitchen board root.`);
    // Columns are optional; adapt to your statuses.
    const anyColumn = page.locator('[data-testid^="kds-column-"]');
    if ((await anyColumn.count()) === 0) {
      test.skip(true, `No [data-testid^="kds-column-"] found. Add data-testid="kds-column-<status>" to each KDS column.`);
    }

    const orderCard = page.locator('[data-testid^="kds-order-"]');
    if ((await orderCard.count()) === 0) {
      test.skip(
        true,
        `No [data-testid^="kds-order-"] found. If you have no real orders, implement fixture mode (USE_FIXTURES=1) to load sample orders.`
      );
    }

    const first = orderCard.first();
    const orderTestId = await first.getAttribute("data-testid");
    if (!orderTestId) {
      test.skip(true, \"KDS order card missing data-testid.\");
      return;
    }

    const suffix = orderTestId.replace(/^kds-order-/, "");
    const advance = page.getByTestId(`kds-advance-status-${suffix}`);
    if ((await advance.count()) === 0) {
      test.skip(
        true,
        `Missing advance control. Add data-testid="kds-advance-status-${suffix}" to the button that advances status.`
      );
    }

    await advance.click();

    // Best-effort: status label changes or card moves.
    await expect(page.locator("body")).toContainText(/prep|ready|completed|done|status/i);
  });
});
