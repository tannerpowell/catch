export interface GeoPoint { lat: number; lng: number }
export interface Hours {
  sunday?: string; monday?: string; tuesday?: string; wednesday?: string;
  thursday?: string; friday?: string; saturday?: string;
}

export interface Location {
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  geo?: GeoPoint;
  hours?: Hours;
  openToday?: boolean;
  hasHappyHour?: boolean;
  hasSalsaNight?: boolean;
  revelUrl?: string;
  doordashUrl?: string;
  uberEatsUrl?: string;
  menuUrl?: string;
  directionsUrl?: string;
  heroImage?: string;
}

export type Badge =
  | "Family Favorite" | "Salvadoran" | "Tex-Mex" | "Spicy" | "Vegetarian" | "Gluten-Free"
  | "Cajun" | "Fried" | "Grilled" | "Boiled" | "Market Price";

export interface LocationOverride { price?: number; available?: boolean }

export interface Option { id: string; name: string; priceDelta?: number }
export interface OptionGroup { id: string; name: string; required?: boolean; maxSelect?: number; options: Option[] }
export interface ComboComponent { itemName: string; quantity: number; notes?: string }

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  price?: number | null;
  badges?: Badge[];
  dietTags?: string[];
  image?: string;
  behindTheDishUrl?: string | null;
  locationOverrides?: Record<string, LocationOverride>;
  optionGroups?: OptionGroup[];
  comboComponents?: ComboComponent[];
}

export interface MenuCategory { slug: string; title: string; position?: number; description?: string }

export interface StoryPost {
  title: string; slug: string; category: "In the News" | "Behind the Dish" | "Other";
  excerpt?: string; body?: string; date?: string; heroImage?: string; canonicalUrl?: string;
}

export interface PrivateEventPolicy {
  perPersonMinimum?: string; seasonalLimitations?: string; locations?: string[]; inquiryFormUrl?: string
}

export interface BrandAdapter {
  brandName: string;
  getCategories(): Promise<MenuCategory[]>;
  getItems(): Promise<MenuItem[]>;
  getLocations(): Promise<Location[]>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  getItemsByCategory(slug: string): Promise<MenuItem[]>;
}
