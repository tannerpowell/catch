import type { MenuItem } from "@/lib/types";

export interface MenuDisplayItem extends MenuItem {
  displayPrice: number | null;
  isAvailable: boolean;
  availabilityNote?: string;
  hasPriceOverride?: boolean;
}
