export interface GeoPoint { lat: number; lng: number }
export interface Hours {
  sunday?: string; monday?: string; tuesday?: string; wednesday?: string;
  thursday?: string; friday?: string; saturday?: string;
}

export interface Location {
  _id: string;
  name: string;
  slug: string;
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
