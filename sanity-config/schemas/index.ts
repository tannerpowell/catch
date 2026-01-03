import location from "./location";
import menuCategory from "./menuCategory";
import menuItem, { locationOverride, priceVariant, itemModifierOverride } from "./menuItem";
import modifierGroup, { modifierOption } from "./modifierGroup";
import order from "./order";

export const schemaTypes = [
  // Core documents
  location,
  menuCategory,
  menuItem,
  modifierGroup,
  order,
  // Object types
  priceVariant,
  locationOverride,
  itemModifierOverride,
  modifierOption,
];
