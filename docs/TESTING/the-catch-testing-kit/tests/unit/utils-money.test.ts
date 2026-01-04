import { describe, expect, test } from "vitest";
import { importOrSkip } from "./_helpers";

describe("Money utilities (formatPrice/toCents/toDollars)", () => {
  test("toCents and toDollars are inverses for common values", async () => {
    const mod = await importOrSkip(
      // Update this import path to your project (example uses tsconfig alias "@/")
      () => import("@/lib/money"),
      "Update import path: expected money utils at @/lib/money (adjust to your repo)."
    );
    if (!mod) return;

    const { toCents, toDollars } = mod as any;

    expect(toCents(0)).toBe(0);
    expect(toCents(1)).toBe(100);
    expect(toCents(12.34)).toBe(1234);

    expect(toDollars(0)).toBe(0);
    expect(toDollars(100)).toBe(1);
    expect(toDollars(1234)).toBe(12.34);
  });
});
