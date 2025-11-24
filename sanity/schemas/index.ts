import location from "./location";
import menuCategory from "./menuCategory";
import menuItem, { locationOverride, priceVariant } from "./menuItem";
import order from "./order";

export const schemaTypes = [location, menuCategory, menuItem, priceVariant, locationOverride, order];
