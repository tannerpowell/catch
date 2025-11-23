import { type BrandAdapter } from "@/lib/types";
import * as sanityCatch from "@/lib/adapters/sanity-catch";

export function getBrand(): BrandAdapter {
  const key = (process.env.BRAND || "cms-catch").toLowerCase();
  switch (key) {
    case "cms-catch":
    case "catch":
    default:
      return sanityCatch.adapter;
  }
}
