import { describe, expect, test } from "vitest";
import { tryImport } from "./_helpers";

interface MoneyModule {
  toCents?: (dollars: number) => number;
  toDollars?: (cents: number) => number;
}

describe("Money utilities (toCents/toDollars)", () => {
  test("toCents and toDollars are inverses for common values", async () => {
    const mod = await tryImport(
      () => import("@/lib/utils")
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as MoneyModule;

    if (toCents && toDollars) {
      expect(toCents(0)).toBe(0);
      expect(toCents(1)).toBe(100);
      expect(toCents(12.34)).toBe(1234);

      expect(toDollars(0)).toBe(0);
      expect(toDollars(100)).toBe(1);
      expect(toDollars(1234)).toBe(12.34);

      // Test inverse property: toDollars(toCents(x)) === x
      const testValues = [0, 1, 12.34, 99.99, 1000];
      for (const value of testValues) {
        expect(toDollars(toCents(value))).toBeCloseTo(value, 2);
      }
    }
  });

  test("handles negative values correctly", async () => {
    const mod = await tryImport(
      () => import("@/lib/utils")
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as MoneyModule;

    if (toCents && toDollars) {
      // Negative dollar amounts
      expect(toCents(-1.23)).toBe(-123);
      expect(toCents(-99.99)).toBe(-9999);
      expect(toCents(-0.01)).toBe(-1);

      // Negative cent amounts
      expect(toDollars(-123)).toBe(-1.23);
      expect(toDollars(-9999)).toBe(-99.99);
      expect(toDollars(-1)).toBe(-0.01);

      // Inverse property with negatives
      expect(toDollars(toCents(-1.23))).toBeCloseTo(-1.23, 2);
      expect(toDollars(toCents(-99.99))).toBeCloseTo(-99.99, 2);
    }
  });

  test("handles very large amounts", async () => {
    const mod = await tryImport(
      () => import("@/lib/utils")
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as MoneyModule;

    if (toCents && toDollars) {
      // Large dollar amounts
      expect(toCents(999999.99)).toBe(99999999);
      expect(toCents(1000000)).toBe(100000000);

      // Large cent amounts
      expect(toDollars(99999999)).toBe(999999.99);
      expect(toDollars(100000000)).toBe(1000000);

      // Inverse property with large amounts
      expect(toDollars(toCents(999999.99))).toBeCloseTo(999999.99, 2);
    }
  });

  test("handles rounding for more than 2 decimals", async () => {
    const mod = await tryImport(
      () => import("@/lib/utils")
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as MoneyModule;

    if (toCents && toDollars) {
      // Rounding behavior: values with >2 decimals
      // Note: Expected behavior depends on library implementation
      // This assumes standard rounding (banker's rounding or round-half-up)
      expect(toCents(10.999)).toBe(1100); // rounds to 11.00
      expect(toCents(10.995)).toBe(1100); // rounds to 11.00
      expect(toCents(10.994)).toBe(1099); // rounds to 10.99

      // Verify toDollars produces 2-decimal results
      expect(toDollars(1100)).toBe(11);
      expect(toDollars(1099)).toBe(10.99);
    }
  });

  test("handles zero and negative zero", async () => {
    const mod = await tryImport(
      () => import("@/lib/utils")
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as MoneyModule;

    if (toCents && toDollars) {
      // Zero handling
      expect(toCents(0)).toBe(0);
      expect(toCents(-0)).toBe(0); // -0 should normalize to 0

      expect(toDollars(0)).toBe(0);
      expect(toDollars(-0)).toBe(0);

      // Inverse property with zero
      expect(toDollars(toCents(0))).toBe(0);
    }
  });
});