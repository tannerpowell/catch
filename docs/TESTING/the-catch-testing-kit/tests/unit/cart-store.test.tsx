import { describe, expect, test } from "vitest";
import { importOrSkip } from "./_helpers";

describe("Cart store/context core ops", () => {
  test("add/remove/update/clear", async () => {
    const mod = await importOrSkip(
      // Update these imports to match your implementation:
      () => import("@/lib/cart/store"),
      "Update import path: expected cart store at @/lib/cart/store (adjust to your repo)."
    );
    if (!mod) return;

    // Recommended: expose pure functions for unit testing (reducer/actions)
    const { createCartStore } = mod as any;
    if (!createCartStore) {
      // If you use a reducer instead, adapt this test to your reducer API.
      return;
    }

    const cart = createCartStore();

    cart.add({ id: "item1", name: "Test Item", priceCents: 999, qty: 1 });
    expect(cart.getItems().length).toBe(1);

    cart.updateQty("item1", 2);
    expect(cart.getItems()[0].qty).toBe(2);

    cart.remove("item1");
    expect(cart.getItems().length).toBe(0);

    cart.add({ id: "item1", name: "Test Item", priceCents: 999, qty: 1 });
    cart.clear();
    expect(cart.getItems().length).toBe(0);
  });
});
