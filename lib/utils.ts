import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert dollars to cents (integer).
 * Use this when storing or calculating money to avoid float precision issues.
 */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents (integer) to dollars (float).
 * Use this for display purposes only.
 */
export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format a price for display.
 * Accepts either dollars (float) or cents (integer) based on the `inCents` flag.
 *
 * @param amount - The price amount
 * @param options.inCents - If true, treats amount as cents; if false, treats as dollars (default: false)
 * @param options.showCents - If true, always shows cents; if false, shows whole dollars when possible (default: true)
 * @returns Formatted price string like "$12.99"
 */
export function formatPrice(
  amount: number | null | undefined,
  options: { inCents?: boolean; showCents?: boolean } = {}
): string {
  if (amount == null) return "Market Price";

  const { inCents = false, showCents = true } = options;
  const dollars = inCents ? amount / 100 : amount;

  if (!showCents && dollars === Math.floor(dollars)) {
    return `$${dollars.toFixed(0)}`;
  }

  return `$${dollars.toFixed(2)}`;
}
