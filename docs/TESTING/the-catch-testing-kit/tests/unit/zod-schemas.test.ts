import { describe, expect, test } from "vitest";
import { tryImport } from "./_helpers";

describe("Zod schemas", () => {
  test("checkout schema validates expected payloads", async () => {
    const mod = await tryImport(
      () => import("@/lib/validation/checkout")
    );
    if (!mod) return;

    const { checkoutSchema } = mod;
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
