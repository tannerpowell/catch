import type { MenuItem } from '@/lib/types';

/**
 * Format a price for display.
 * Returns "MKT" for null/undefined prices (market price items).
 * Returns integer format for whole numbers, decimal format otherwise.
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "MKT";
  return price % 1 === 0 ? `${price}` : price.toFixed(2);
}

/**
 * Get the effective price for a menu item at a specific location.
 * Checks for location-specific price overrides first, then falls back to base price.
 */
export function getEffectivePrice(item: MenuItem, locationSlug: string): number | null {
  const override = item.locationOverrides?.[locationSlug];
  if (override?.price != null) return override.price;
  return item.price ?? null;
}
