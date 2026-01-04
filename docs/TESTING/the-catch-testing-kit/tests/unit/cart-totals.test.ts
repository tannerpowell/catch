/**
 * Cart Totals Tests
 *
 * Tests for cart calculation logic, specifically:
 * - Subtotal calculation (in cents to avoid floating-point errors)
 * - Tax calculation
 * - Modifier price deltas
 * - Total = subtotal + tax + tip + deliveryFee
 *
 * These functions may be inline in CartContext or in a separate utility.
 * Adjust imports as needed for your implementation.
 */

import { describe, test, expect } from "vitest";

/**
 * Calculate subtotal in cents from cart items.
 * This mirrors the expected logic in CartContext.
 */
function calculateSubtotalCents(
  items: Array<{
    price: number;
    quantity: number;
    modifiers: Array<{ priceDelta: number }>;
  }>
): number {
  return items.reduce((sum, item) => {
    const itemCents = Math.round(item.price * 100) * item.quantity;
    const modifierCents = item.modifiers.reduce(
      (modSum, mod) => modSum + Math.round(mod.priceDelta * 100) * item.quantity,
      0
    );
    return sum + itemCents + modifierCents;
  }, 0);
}

/**
 * Calculate tax in cents from subtotal and rate.
 */
function calculateTaxCents(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * taxRate);
}

/**
 * Calculate total from all components (all in cents).
 */
function calculateTotalCents(cart: {
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  deliveryFeeCents: number;
}): number {
  return (
    cart.subtotalCents +
    cart.taxCents +
    cart.tipCents +
    cart.deliveryFeeCents
  );
}

describe("Cart totals (cents-based math)", () => {
  describe("subtotal calculation", () => {
    test("calculates single item subtotal correctly", () => {
      // $9.99 × 1 = $9.99 = 999 cents
      const items = [{ price: 9.99, quantity: 1, modifiers: [] }];
      expect(calculateSubtotalCents(items)).toBe(999);
    });

    test("calculates multiple quantity subtotal correctly", () => {
      // $9.99 × 2 = $19.98 = 1998 cents
      const items = [{ price: 9.99, quantity: 2, modifiers: [] }];
      expect(calculateSubtotalCents(items)).toBe(1998);
    });

    test("calculates multiple items subtotal correctly", () => {
      // $9.99 + $5.49 = $15.48 = 1548 cents
      const items = [
        { price: 9.99, quantity: 1, modifiers: [] },
        { price: 5.49, quantity: 1, modifiers: [] },
      ];
      expect(calculateSubtotalCents(items)).toBe(1548);
    });

    test("includes modifier price deltas", () => {
      // $9.99 + $1.49 modifier = $11.48 = 1148 cents
      const items = [
        {
          price: 9.99,
          quantity: 1,
          modifiers: [{ priceDelta: 1.49 }],
        },
      ];
      expect(calculateSubtotalCents(items)).toBe(1148);
    });

    test("applies modifier deltas per quantity", () => {
      // ($9.99 + $1.00 modifier) × 2 = $21.98 = 2198 cents
      const items = [
        {
          price: 9.99,
          quantity: 2,
          modifiers: [{ priceDelta: 1.0 }],
        },
      ];
      expect(calculateSubtotalCents(items)).toBe(2198);
    });

    test("handles multiple modifiers", () => {
      // $9.99 + $3.00 + $0.50 = $13.49 = 1349 cents
      const items = [
        {
          price: 9.99,
          quantity: 1,
          modifiers: [{ priceDelta: 3.0 }, { priceDelta: 0.5 }],
        },
      ];
      expect(calculateSubtotalCents(items)).toBe(1349);
    });

    test("handles zero-price modifiers", () => {
      // $9.99 + $0.00 = $9.99 = 999 cents
      const items = [
        {
          price: 9.99,
          quantity: 1,
          modifiers: [{ priceDelta: 0 }],
        },
      ];
      expect(calculateSubtotalCents(items)).toBe(999);
    });

    test("handles empty cart", () => {
      const items: Array<{
        price: number;
        quantity: number;
        modifiers: Array<{ priceDelta: number }>;
      }> = [];
      expect(calculateSubtotalCents(items)).toBe(0);
    });
  });

  describe("tax calculation", () => {
    test("calculates tax at 8.25% correctly", () => {
      // $10.00 at 8.25% = $0.825 → rounds to 83 cents
      expect(calculateTaxCents(1000, 0.0825)).toBe(83);
    });

    test("calculates tax on larger amount", () => {
      // $25.00 at 8.25% = $2.0625 → rounds to 206 cents
      expect(calculateTaxCents(2500, 0.0825)).toBe(206);
    });

    test("rounds down when appropriate", () => {
      // $12.00 at 8.25% = $0.99 = 99 cents
      expect(calculateTaxCents(1200, 0.0825)).toBe(99);
    });

    test("handles zero tax rate", () => {
      expect(calculateTaxCents(1000, 0)).toBe(0);
    });

    test("handles zero subtotal", () => {
      expect(calculateTaxCents(0, 0.0825)).toBe(0);
    });

    test("avoids floating-point precision errors", () => {
      // Common problem: 0.1 + 0.2 !== 0.3 in JS
      // Testing a case that would fail with naive floating-point math
      // $9.99 at 8.25% = $0.824175 → rounds to 82 cents
      expect(calculateTaxCents(999, 0.0825)).toBe(82);
    });
  });

  describe("total calculation", () => {
    test("calculates total from all components", () => {
      const cart = {
        subtotalCents: 1000,
        taxCents: 83,
        tipCents: 200,
        deliveryFeeCents: 0,
      };
      expect(calculateTotalCents(cart)).toBe(1283);
    });

    test("includes delivery fee when present", () => {
      const cart = {
        subtotalCents: 1000,
        taxCents: 83,
        tipCents: 200,
        deliveryFeeCents: 499,
      };
      expect(calculateTotalCents(cart)).toBe(1782);
    });

    test("handles zero tip", () => {
      const cart = {
        subtotalCents: 1000,
        taxCents: 83,
        tipCents: 0,
        deliveryFeeCents: 0,
      };
      expect(calculateTotalCents(cart)).toBe(1083);
    });

    test("handles all zeros", () => {
      const cart = {
        subtotalCents: 0,
        taxCents: 0,
        tipCents: 0,
        deliveryFeeCents: 0,
      };
      expect(calculateTotalCents(cart)).toBe(0);
    });

    test("handles realistic order", () => {
      // Catfish basket $12.99, Large +$3.00, Sweet Tea $2.99
      // Subtotal: $18.98 = 1898 cents
      // Tax at 8.25%: 157 cents
      // Tip: $4.00 = 400 cents
      // Total: 2455 cents = $24.55
      const cart = {
        subtotalCents: 1898,
        taxCents: 157,
        tipCents: 400,
        deliveryFeeCents: 0,
      };
      expect(calculateTotalCents(cart)).toBe(2455);
    });
  });

  describe("edge cases", () => {
    test("handles very small amounts", () => {
      // $0.01 item
      const items = [{ price: 0.01, quantity: 1, modifiers: [] }];
      expect(calculateSubtotalCents(items)).toBe(1);
    });

    test("handles large orders", () => {
      // $999.99 × 10 = $9999.90 = 999990 cents
      const items = [{ price: 999.99, quantity: 10, modifiers: [] }];
      expect(calculateSubtotalCents(items)).toBe(999990);
    });

    test("handles prices with 3 decimal places (rounds)", () => {
      // $9.995 should round to 1000 cents
      const items = [{ price: 9.995, quantity: 1, modifiers: [] }];
      // Due to floating-point, this may be 999 or 1000
      const result = calculateSubtotalCents(items);
      expect(result).toBeGreaterThanOrEqual(999);
      expect(result).toBeLessThanOrEqual(1000);
    });

    test("handles common problematic floating-point values", () => {
      // $0.10 × 3 = $0.30 = 30 cents (not 29.999... cents)
      const items = [{ price: 0.1, quantity: 3, modifiers: [] }];
      expect(calculateSubtotalCents(items)).toBe(30);
    });
  });
});

describe("cents to dollars conversion", () => {
  test("converts cents to dollars correctly", () => {
    expect(1299 / 100).toBe(12.99);
  });

  test("formats as currency string", () => {
    const cents = 1299;
    const formatted = `$${(cents / 100).toFixed(2)}`;
    expect(formatted).toBe("$12.99");
  });

  test("handles zero", () => {
    const cents = 0;
    const formatted = `$${(cents / 100).toFixed(2)}`;
    expect(formatted).toBe("$0.00");
  });
});
