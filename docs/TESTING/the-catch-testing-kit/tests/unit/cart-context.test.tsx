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

import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { tryImport, createMockLocalStorage, resetLocalStorage } from "./_helpers";
import { ReactNode } from "react";

// Mock localStorage
const mockStorage = createMockLocalStorage();
Object.defineProperty(window, "localStorage", { value: mockStorage });

describe("CartContext", () => {
  let CartProvider: React.ComponentType<{ children: ReactNode }>;
  let useCart: () => {
    cart: unknown;
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

  // Sample test data
  const mockLocation = {
    _id: "loc_arlington",
    slug: "arlington",
    name: "Arlington",
    taxRate: 0.0825,
  };

  const mockLocation2 = {
    _id: "loc_garland",
    slug: "garland",
    name: "Garland",
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
    // Reset localStorage between tests
    resetLocalStorage(mockStorage);

    // Try to import the cart context
    const cartModule = await tryImport(() => import("@/lib/contexts/CartContext"));

    if (!cartModule) {
      return;
    }

    CartProvider = cartModule.CartProvider;
    useCart = cartModule.useCart;
  });

  test("starts with empty cart", async (ctx) => {
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cart).toBeDefined();
    expect(result.current.itemCount).toBe(0);
    expect(result.current.isLocationLocked).toBe(false);
  });

  test("adds item to cart", async (ctx) => {
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    expect(result.current.itemCount).toBe(1);
    expect(result.current.isLocationLocked).toBe(true);
  });

  test("persists cart to localStorage", async (ctx) => {
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    const stored = mockStorage.getItem("catch-cart");
    expect(stored).toBeTruthy();
    expect(stored).toContain("Fried Catfish");
  });

  test("removes item from cart", async (ctx) => {
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

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
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

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
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

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
    if (!useCart || !CartProvider) {
      ctx.skip();
      return;
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockItem, mockLocation);
    });

    act(() => {
      result.current.setTip(5);
    });

    // @ts-expect-error - accessing cart properties
    expect(result.current.cart?.tip).toBe(5);
  });

  describe("location locking", () => {
    test("allows items from same location", async (ctx) => {
      if (!useCart || !CartProvider) {
        ctx.skip();
        return;
      }

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItem, mockLocation);
      });

      expect(result.current.canAddFromLocation("loc_arlington")).toBe(true);
    });

    test("rejects items from different location", async (ctx) => {
      if (!useCart || !CartProvider) {
        ctx.skip();
        return;
      }

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItem, mockLocation);
      });

      expect(result.current.canAddFromLocation("loc_garland")).toBe(false);
    });

    test("unlocks location after clearing cart", async (ctx) => {
      if (!useCart || !CartProvider) {
        ctx.skip();
        return;
      }

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

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
      if (!useCart || !CartProvider) {
        ctx.skip();
        return;
      }

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItemWithModifiers, mockLocation);
      });

      // @ts-expect-error - accessing cart items
      const items = result.current.cart?.items ?? [];
      expect(items.length).toBe(1);
      expect(items[0].modifiers.length).toBe(2);
      expect(items[0].modifiers[0].option).toBe("Large");
    });

    test("preserves special instructions", async (ctx) => {
      if (!useCart || !CartProvider) {
        ctx.skip();
        return;
      }

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockItemWithModifiers, mockLocation);
      });

      // @ts-expect-error - accessing cart items
      const items = result.current.cart?.items ?? [];
      expect(items[0].specialInstructions).toBe("Extra crispy");
    });
  });
});
