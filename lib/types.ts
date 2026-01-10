// Re-export Badge from the single source of truth
export type { Badge } from "./constants/badges";
import type { Badge } from "./constants/badges";

export interface GeoPoint { lat: number; lng: number }
export interface Hours {
  sunday?: string; monday?: string; tuesday?: string; wednesday?: string;
  thursday?: string; friday?: string; saturday?: string;
}

export type LocationRegion = "dfw" | "houston" | "oklahoma" | "east-tx" | "west-tx";

export interface Location {
  _id: string;
  name: string;
  slug: string;
  region?: LocationRegion;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  email?: string;
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
  // Stripe Connect fields
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeOnboardingLink?: string;
  stripeDashboardLink?: string;
  // Revel POS
  revelEstablishmentId?: string;
  storeId?: number;
  // Online ordering settings
  onlineOrderingEnabled?: boolean;
  acceptingOrders?: boolean;
  orderTypes?: ("pickup" | "delivery" | "dine-in")[];
  minimumOrderAmount?: number;
  deliveryFee?: number;
  taxRate?: number;
}

export interface LocationOverride { price?: number; available?: boolean }

/** @deprecated Use ModifierOption instead */
export interface Option { id: string; name: string; priceDelta?: number }
/** @deprecated Use ModifierGroup instead */
export interface OptionGroup { id: string; name: string; required?: boolean; maxSelect?: number; options: Option[] }
/** @deprecated Legacy combo component type */
export interface ComboComponent { itemName: string; quantity: number; notes?: string }

// === MODIFIER TYPES (for online ordering) ===

/**
 * A single option within a modifier group
 * e.g., "Ranch", "MED +$11.49", "Fries"
 */
export interface ModifierOption {
  _key: string;
  name: string;
  price?: number;         // Additional cost (e.g., 1.49 for +$1.49)
  isDefault?: boolean;    // Pre-selected by default
  available?: boolean;    // Can be toggled off
  calories?: number;      // Optional nutrition info
}

/**
 * A group of modifier options
 * e.g., "Size", "Dressing", "One Side", "Add Ons"
 */
export interface ModifierGroup {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  required: boolean;
  multiSelect: boolean;   // Single-select vs multi-select
  minSelections?: number; // For multi-select
  maxSelections?: number; // For multi-select
  options: ModifierOption[];
  displayOrder?: number;
}

/**
 * Item-specific override for a modifier option
 * Allows different pricing per item (e.g., "MED" costs different for different baskets)
 */
export interface ItemModifierOverride {
  _key: string;
  modifierGroupId: string;
  optionName: string;
  price?: number;
  available?: boolean;
}

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
  availableEverywhere?: boolean;
  locationOverrides?: Record<string, LocationOverride>;
  // Legacy option groups (kept for backward compatibility)
  optionGroups?: OptionGroup[];
  comboComponents?: ComboComponent[];
  // New modifier system (for online ordering)
  modifierGroups?: ModifierGroup[];
  itemModifierOverrides?: ItemModifierOverride[];
  allowSpecialInstructions?: boolean;
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

// === ONLINE ORDERING TYPES ===

export interface CartModifier {
  name: string;
  option: string;
  priceDelta: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
}

export interface Cart {
  location: Location | null;
  locationId: string | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded" | "partially_refunded";
export type OrderType = "pickup" | "delivery" | "dine-in";

export interface OrderItem {
  _key?: string; // Sanity array item key
  menuItem: { _ref: string; _type: "reference" };
  menuItemSnapshot: {
    name: string;
    description?: string;
    basePrice: number;
  };
  quantity: number;
  price: number;
  totalPrice: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
}

export interface Order {
  _id: string;
  _type: "order";
  orderNumber: string;
  status: OrderStatus;
  location: { _ref: string; _type: "reference" };
  locationSnapshot: {
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    marketingOptIn: boolean;
  };
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  tip: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  locationPayout?: number;
  // Stripe fields
  stripePaymentIntentId?: string;
  stripeAccountId?: string;
  stripeChargeId?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: {
    brand: string;
    last4: string;
    type: string;
  };
  refundAmount?: number;
  refundReason?: string;
  // Fulfillment
  scheduledFor?: string;
  estimatedReadyTime?: string;
  deliveryAddress?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    instructions?: string;
  };
  specialInstructions?: string;
  // Revel integration
  revelOrderId?: string;
  revelSynced: boolean;
  revelSyncedAt?: string;
  revelSyncError?: string;
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  // Notes
  internalNotes?: Array<{
    note: string;
    author: string;
    timestamp: string;
  }>;
}
