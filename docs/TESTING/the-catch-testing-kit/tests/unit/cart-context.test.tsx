/**
 * Cart Context Tests
 *
 * Tests for the CartContext provider, covering:
 * - Adding/removing items
 * - Location locking
 * - LocalStorage persistence
 * - Quantity updates
 * - Clear cart functionality
 */

import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { tryImport } from "./_helpers";
import { ReactNode } from "react";

// Cart type definitions
interface CartModifier {
  name: string;
  option: string;
  priceDelta: number;
}

interface CartItem {
  menuItem: {
    _id: string;
    name: string;
    slug: string;
  };
  quantity: number;
  price: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
}

interface Cart {
  items: CartItem[];
  location?: {
    _id: string;
    slug: string;
    name: string;
    taxRate: number;
  };
  tip?: number;
}

describe("CartContext", () => {
  let CartProvider: React.ComponentType<{ children: ReactNode }>;
  let useCart: () => {
    cart?: Cart;
    addToCart: (item: unknown, location: unknown) => void;
    removeFromCart: (index: number) => void;
    updateQuantity: (index: number, qty: number) => void;
    clearCart: () => void;
    setTip: (amount: number) => void;
    canAddFromLocation: (locationId: string) => boolean;
    isLocationLocked: boolean;
    itemCount: number;
    isHydrated: boolean;
  };
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  // Sample test data
  const mockLocation = {
    _id: "loc_arlington",
    slug: "arlington",
    name: "Arlington",
    taxRate: 0.0825,
  };

  const mockItem = {
    menuItem: {
      _id: "item_catfish",
      name: "Fried Catfish Basket",
      slug: "fried-catfish",
    },
    quantity: 1,
    price: 12.99,
    modifiers: [],
    specialInstructions: "",
  };

  const mockItemWithModifiers = {
    menuItem: {
      _id: "item_catfish",
      name: "Fried Catfish Basket",
      slug: "fried-catfish",
    },
    quantity: 1,
    price: 12.99,
    modifiers: [
      { name: "Size", option: "Large", priceDelta: 3.0 },
      { name: "Sauce", option: "Extra Tartar", priceDelta: 0.5 },
    ],
    specialInstructions: "Extra crispy",
  };

  beforeEach(async () => {
    // Reset localStorage between tests if available
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }

    // Try to import the cart context
    const cartModule = await tryImport(() => import("@/lib/contexts/CartContext"));

    if (!cartModule) {
      return;
    }

    CartProvider = cartModule.CartProvider;
    useCart = cartModule.useCart;

    // Define wrapper once for all tests
    wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
  });

  test("starts with empty cart", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cart).toBeDefined();
    expect(result.current.itemCount).toBe(0);
    expect(result.current.isLocationLocked).toBe(false);
  });

  test("adds item to cart", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    expect(result.current.itemCount).toBe(1);
    expect(result.current.isLocationLocked).toBe(true);
  });

  test("persists cart to localStorage", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    const stored = localStorage.getItem("catch-cart");
    expect(stored).toBeTruthy();
    expect(stored).toContain("Fried Catfish");
  });

  test("removes item from cart", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    expect(result.current.itemCount).toBe(1);

    act(() => {
      result.current.removeFromCart(0);
    });

    expect(result.current.itemCount).toBe(0);
  });

  test("updates item quantity", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    act(() => {
      result.current.updateQuantity(0, 3);
    });

    expect(result.current.itemCount).toBe(3);
  });

  test("clears cart", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    expect(result.current.itemCount).toBe(1);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.itemCount).toBe(0);
    expect(result.current.isLocationLocked).toBe(false);
  });

  test("sets tip amount", async (ctx) => {
    if (!wrapper) {
      ctx.skip();
      return;
    }

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    act(() => {
      result.current.setTip(5);
    });

    expect(result.current.cart?.tip).toBe(5);
  });

  describe("location locking", () => {
    test("allows items from same location", async (ctx) => {
      if (!wrapper) {
        ctx.skip();
        return;
      }

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItem, mockLocation);
      });

      expect(result.current.canAddFromLocation("loc_arlington")).toBe(true);
    });

    test("rejects items from different location", async (ctx) => {
      if (!wrapper) {
        ctx.skip();
        return;
      }

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItem, mockLocation);
      });

      expect(result.current.canAddFromLocation("loc_garland")).toBe(false);
    });

    test("unlocks location after clearing cart", async (ctx) => {
      if (!wrapper) {
        ctx.skip();
        return;
      }

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItem, mockLocation);
      });

      expect(result.current.canAddFromLocation("loc_garland")).toBe(false);

      act(() => {
        result.current.clearCart();
      });

      // After clearing, any location should be allowed
      expect(result.current.canAddFromLocation("loc_garland")).toBe(true);
      expect(result.current.canAddFromLocation("loc_arlington")).toBe(true);
    });
  });

  describe("modifiers and special instructions", () => {
    test("preserves modifiers when adding item", async (ctx) => {
      if (!wrapper) {
        ctx.skip();
        return;
      }

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItemWithModifiers, mockLocation);
      });

      const items = result.current.cart?.items ?? [];
      expect(items.length).toBe(1);
      expect(items[0].modifiers.length).toBe(2);
      expect(items[0].modifiers[0].option).toBe("Large");
    });

    test("preserves special instructions", async (ctx) => {
      if (!wrapper) {
        ctx.skip();
        return;
      }

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItemWithModifiers, mockLocation);
      });

      const items = result.current.cart?.items ?? [];
      expect(items[0].specialInstructions).toBe("Extra crispy");
    });
  });
});
