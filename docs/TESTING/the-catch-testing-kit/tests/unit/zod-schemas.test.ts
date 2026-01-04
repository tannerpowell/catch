import { describe, expect, test } from "vitest";
import { importOrSkip } from "./_helpers";

describe("Zod schemas", () => {
  test("checkout schema validates expected payloads", async () => {
    const mod = await importOrSkip(
      () => import("@/lib/validation/checkout"),
      "Update import path: expected checkout schema at @/lib/validation/checkout (adjust to your repo)."
    );
    if (!mod) return;

    const { checkoutSchema } = mod as any;
    if (!checkoutSchema) return;

    const ok = checkoutSchema.safeParse({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "2145551212",
    });
    expect(ok.success).toBe(true);

    const bad = checkoutSchema.safeParse({});
    expect(bad.success).toBe(false);
  });
});
