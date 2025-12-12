import type { MenuItem } from '@/lib/types';

/**
 * Determines if a menu item is available at a specific location.
 *
 * OPT-IN MODEL:
 * - Items are HIDDEN by default at all locations
 * - Items show when: availableEverywhere === true OR locationOverrides[slug].available === true
 * - Items hide when: neither condition is met
 *
 * @param item - The menu item to check
 * @param locationSlug - The location slug to check availability for
 * @returns true if the item should be shown at this location
 */
export function isItemAvailableAtLocation(item: MenuItem, locationSlug: string): boolean {
  // "all" is a special case for showing all items (admin/preview mode)
  if (locationSlug === "all") return true;

  // Universal items (drinks, sides, etc.) show everywhere
  if (item.availableEverywhere === true) return true;

  // Check for explicit opt-in at this location
  const override = item.locationOverrides?.[locationSlug];

  // OPT-IN: Only show if explicitly available at this location
  return override?.available === true;
}

/**
 * Returns the location-specific price for an item, falling back to base price.
 *
 * @param item - The menu item
 * @param locationSlug - The location to get pricing for
 * @returns The price (location-specific or base), or null if no price set
 */
export function getItemPriceAtLocation(item: MenuItem, locationSlug: string): number | null {
  if (locationSlug !== "all" && item.locationOverrides?.[locationSlug]?.price !== undefined) {
    return item.locationOverrides[locationSlug].price ?? null;
  }
  return item.price ?? null;
}
