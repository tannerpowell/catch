import { describe, expect, test } from "vitest";
import { tryImport } from "./_helpers";

interface CartStoreModule {
  createCartStore?: () => {
    add: (item: { id: string; name: string; priceCents: number; qty: number }) => void;
    remove: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    clear: () => void;
    getItems: () => Array<{ id: string; name: string; priceCents: number; qty: number }>;
  };
}

describe("Cart store/context core ops", () => {
  test("add/remove/update/clear", async () => {
    const mod = await tryImport(
      () => import("@/lib/cart/store")
    );
    if (!mod) return;

    // Recommended: expose pure functions for unit testing (reducer/actions)
    const { createCartStore } = mod as CartStoreModule;
    if (!createCartStore) {
      // If you use a reducer instead, adapt this test to your reducer API.
      return;
    }

    const cart = createCartStore();

    cart.add({ id: "item1", name: "Test Item", priceCents: 999, qty: 1 });
    expect(cart.getItems().length).toBe(1);

    cart.updateQty("item1", 2);
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].qty).toBe(2);
    expect(items[0].id).toBe("item1");
    expect(items[0].name).toBe("Test Item");
    expect(items[0].priceCents).toBe(999);

    cart.remove("item1");
    expect(cart.getItems().length).toBe(0);

    cart.add({ id: "item1", name: "Test Item", priceCents: 999, qty: 1 });
    cart.clear();
    expect(cart.getItems().length).toBe(0);
  });
});