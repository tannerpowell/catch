import { createClient } from "@sanity/client";
import groq from "groq";
import type { Badge, BrandAdapter, Location, MenuCategory, MenuItem, ModifierGroup, ItemModifierOverride } from "@/lib/types";
import { demoCategories, demoItems, demoLocations } from "@/lib/adapters/demo-data";
import { z } from "zod";
import { unstable_cache } from "next/cache";
import { SANITY_API_VERSION, withTimeout } from "@/lib/sanity/constants";
import { withCircuitBreaker, type CircuitState } from "@/lib/utils/circuit-breaker";

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 60; // 1 minute default TTL
export const CACHE_TAGS = {
  categories: 'sanity-categories',
  locations: 'sanity-locations',
  items: 'sanity-items',
  all: 'sanity-content',
} as const;

// Circuit breaker configuration for Sanity
const SANITY_CIRCUIT_OPTIONS = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  onStateChange: (from: CircuitState, to: CircuitState, serviceName: string) => {
    if (to === 'OPEN') {
      console.error(`[Sanity] Circuit breaker OPEN for ${serviceName} - falling back to demo data`);
    } else if (to === 'CLOSED') {
      console.log(`[Sanity] Circuit breaker CLOSED for ${serviceName} - back to normal operation`);
    }
  },
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const hasSanityConfig = Boolean(projectId && dataset);

const client = hasSanityConfig
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion: SANITY_API_VERSION,
      useCdn: true, // Use CDN for faster responses
      perspective: 'published', // Only fetch published content
      stega: {
        enabled: false, // Disable for production, enable in draft mode
        studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '/studio'
      }
    })
  : null;

const fallbackLocationPhotography: Record<string, string> = {
  conroe: "/images/Location-Conroe.jpg",
  humble: "/images/Location-Humble.jpg",
  "s-post-oak": "/images/Location-Post-Oak.jpg",
  willowbrook: "/images/Location-Willowbrook.jpg"
};
const defaultFallbackHero = fallbackLocationPhotography.humble;

// Fallback geo coordinates for each location
export const fallbackGeoCoordinates: Record<string, { lat: number; lng: number }> = {
  // Oklahoma locations
  "okc-memorial": { lat: 35.610210, lng: -97.550766 },
  "midwest-city": { lat: 35.440914, lng: -97.405760 },
  "moore": { lat: 35.327000, lng: -97.491210 },
  // Texas locations
  "arlington": { lat: 32.675407, lng: -97.196220 },
  "atascocita": { lat: 29.993227, lng: -95.177946 },
  "burleson": { lat: 32.519184, lng: -97.348927 },
  "coit-campbell": { lat: 32.977688, lng: -96.770851 },
  "conroe": { lat: 30.317270, lng: -95.478130 },
  "denton": { lat: 33.229110, lng: -97.150930 },
  "garland": { lat: 32.949788, lng: -96.651562 },
  "longview": { lat: 32.521200, lng: -94.747800 },
  "lubbock": { lat: 33.519250, lng: -101.921089 },
  "s-post-oak": { lat: 29.672800, lng: -95.460240 },
  "tyler": { lat: 32.331307, lng: -95.289808 },
  "wichita-falls": { lat: 33.880000, lng: -98.520000 },
  "willowbrook": { lat: 29.963846, lng: -95.543372 },
};

const badgeOptions = [
  "Family Favorite",
  "Salvadoran",
  "Tex-Mex",
  "Spicy",
  "Vegetarian",
  "Gluten-Free",
  "Cajun",
  "Fried",
  "Grilled",
  "Boiled",
  "Market Price"
] as const satisfies readonly Badge[];

const badgeSet = new Set<Badge>(badgeOptions);
const isBadge = (value: unknown): value is Badge => typeof value === "string" && badgeSet.has(value as Badge);

const BadgeSchema = z.enum(badgeOptions);

// Note: Hours schema not currently used - using z.any() for flexibility
// If strict hours validation needed, define:
// const HoursSchema = z.object({
//   sunday: z.string().optional(),
//   monday: z.string().optional(),
//   ...
// }).optional();

const GeoPointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180)
}).nullable().optional();

const LocationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hours: z.any().nullable().optional(), // Make hours more lenient
  revelUrl: z.string().url().nullable().optional(),
  doordashUrl: z.string().url().nullable().optional(),
  uberEatsUrl: z.string().url().nullable().optional(),
  menuUrl: z.string().url().nullable().optional(),
  directionsUrl: z.string().url().nullable().optional(),
  heroImage: z.string().nullable().optional(), // Remove .url() validation
  geo: GeoPointSchema
});

const CategorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  position: z.number().nullable().optional(),
  description: z.string().nullable().optional()
});

const ModifierOptionSchema = z.object({
  _key: z.string(),
  name: z.string(),
  price: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
  available: z.boolean().optional(),
  calories: z.number().nullable().optional()
});

const ModifierGroupSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  required: z.boolean().optional(),
  multiSelect: z.boolean().optional(),
  minSelections: z.number().nullable().optional(),
  maxSelections: z.number().nullable().optional(),
  options: z.array(ModifierOptionSchema).optional(),
  displayOrder: z.number().nullable().optional()
});

const ItemModifierOverrideSchema = z.object({
  _key: z.string(),
  modifierGroupId: z.string(),
  optionName: z.string(),
  price: z.number().nullable().optional(),
  available: z.boolean().optional()
});

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  description: z.string().optional(),
  price: z.number().nullable().optional(),
  badges: z.array(BadgeSchema).optional(),
  image: z.string().optional(),
  availableEverywhere: z.boolean().optional(),
  locationOverrides: z
    .record(z.string(), z.object({ price: z.number().nullable().optional(), available: z.boolean().optional() }))
    .optional(),
  modifierGroups: z.array(ModifierGroupSchema).optional(),
  itemModifierOverrides: z.array(ItemModifierOverrideSchema).optional(),
  allowSpecialInstructions: z.boolean().optional()
});

const qCategories = groq`*[_type=="menuCategory"]|order(position asc){ "slug": slug.current, title, position, description }`;
const qLocations = groq`*[_type=="location"]{ _id, name, "slug": slug.current, addressLine1, addressLine2, city, state, postalCode, phone, hours, revelUrl, doordashUrl, uberEatsUrl, menuUrl, directionsUrl, "heroImage": heroImage.asset->url, "geo": geo }`;
const qItems = groq`*[_type=="menuItem"]{
  _id,
  name,
  "slug": slug.current,
  description,
  "categorySlug": category->slug.current,
  "image": image.asset->url,
  badges,
  "basePrice": coalesce(basePrice, null),
  availableEverywhere,
  allowSpecialInstructions,
  "overrides": coalesce(locationOverrides, [])[]{ "loc": location->slug.current, price, available },
  "modifierGroups": modifierGroups[]->{
    _id,
    name,
    "slug": slug.current,
    description,
    required,
    multiSelect,
    minSelections,
    maxSelections,
    displayOrder,
    options[]{ _key, name, price, isDefault, available, calories }
  } | order(displayOrder asc),
  "itemModifierOverrides": itemModifierOverrides[]{
    _key,
    "modifierGroupId": modifierGroup->_id,
    optionName,
    price,
    available
  }
}`;

function normalizeOverrides(arr: { loc: string; price?: number; available?: boolean }[] | undefined) {
  const out: Record<string, { price?: number; available?: boolean }> = {};
  (arr || []).forEach(o => {
    out[o.loc] = { price: o.price, available: o.available };
  });
  return out;
}

function fallbackHero(slug: string) {
  if (slug && fallbackLocationPhotography[slug]) {
    return fallbackLocationPhotography[slug];
  }
  return defaultFallbackHero;
}

// Cached data fetching functions - uses unstable_cache for cross-request caching
// with circuit breaker for resilience

// Raw fetch function (throws on error)
const fetchCategoriesRaw = async (): Promise<MenuCategory[]> => {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qCategories));
  const parsed = z.array(CategorySchema).parse(raw);
  return parsed.map(cat => ({
    ...cat,
    description: cat.description ?? undefined,
    position: cat.position ?? undefined
  }));
};

// Circuit-breaker protected fetch
const fetchCategoriesProtected = withCircuitBreaker(
  'sanity-categories',
  fetchCategoriesRaw,
  () => demoCategories,
  SANITY_CIRCUIT_OPTIONS
);

const fetchCategories = async (): Promise<MenuCategory[]> => {
  if (!client) {
    return demoCategories;
  }
  return fetchCategoriesProtected();
};

const getCategoriesCached = unstable_cache(
  fetchCategories,
  ['sanity-categories'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.categories, CACHE_TAGS.all],
  }
);

// Raw fetch function for locations (throws on error)
const fetchLocationsRaw = async (): Promise<Location[]> => {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qLocations));
  const parsed = z.array(LocationSchema).parse(raw);
  return parsed.map(l => ({
    _id: l._id,
    name: l.name,
    slug: l.slug,
    addressLine1: l.addressLine1 ?? "",
    addressLine2: l.addressLine2 ?? undefined,
    city: l.city ?? "",
    state: l.state ?? "",
    postalCode: l.postalCode ?? "",
    phone: l.phone ?? undefined,
    hours: l.hours ?? undefined,
    revelUrl: l.revelUrl ?? l.menuUrl ?? undefined,
    doordashUrl: l.doordashUrl ?? undefined,
    uberEatsUrl: l.uberEatsUrl ?? undefined,
    menuUrl: l.menuUrl ?? undefined,
    directionsUrl: l.directionsUrl ?? undefined,
    heroImage: l.heroImage ?? fallbackHero(l.slug),
    openToday: !!l.hours,
    geo: l.geo ?? fallbackGeoCoordinates[l.slug] ?? undefined
  }));
};

// Circuit-breaker protected fetch
const fetchLocationsProtected = withCircuitBreaker(
  'sanity-locations',
  fetchLocationsRaw,
  () => demoLocations,
  SANITY_CIRCUIT_OPTIONS
);

const fetchLocations = async (): Promise<Location[]> => {
  if (!client) {
    return demoLocations;
  }
  return fetchLocationsProtected();
};

const getLocationsCached = unstable_cache(
  fetchLocations,
  ['sanity-locations'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.locations, CACHE_TAGS.all],
  }
);

function normalizeModifierGroups(groups: unknown): ModifierGroup[] | undefined {
  if (!Array.isArray(groups) || groups.length === 0) return undefined;

  const normalized = groups
    .filter((g): g is Record<string, unknown> => g !== null && typeof g === 'object')
    // Drop groups missing required identifiers
    .filter((g) => g._id && g.slug && g.name)
    .map((g) => ({
      _id: String(g._id),
      name: String(g.name),
      slug: String(g.slug),
      description: g.description ? String(g.description) : undefined,
      required: Boolean(g.required),
      multiSelect: Boolean(g.multiSelect),
      minSelections: typeof g.minSelections === 'number' ? g.minSelections : undefined,
      maxSelections: typeof g.maxSelections === 'number' ? g.maxSelections : undefined,
      displayOrder: typeof g.displayOrder === 'number' ? g.displayOrder : undefined,
      options: Array.isArray(g.options)
        ? g.options
            .filter((opt: Record<string, unknown>) => opt._key && opt.name)
            .map((opt: Record<string, unknown>) => ({
              _key: String(opt._key),
              name: String(opt.name),
              price: typeof opt.price === 'number' ? opt.price : undefined,
              isDefault: Boolean(opt.isDefault),
              available: opt.available !== false, // Default to true
              calories: typeof opt.calories === 'number' ? opt.calories : undefined,
            }))
        : [],
    }));

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeItemModifierOverrides(overrides: unknown): ItemModifierOverride[] | undefined {
  if (!Array.isArray(overrides) || overrides.length === 0) return undefined;

  const normalized = overrides
    .filter((o): o is Record<string, unknown> => o !== null && typeof o === 'object')
    // Drop overrides missing required identifiers
    .filter((o) => o._key && o.modifierGroupId && o.optionName)
    .map((o) => ({
      _key: String(o._key),
      modifierGroupId: String(o.modifierGroupId),
      optionName: String(o.optionName),
      price: typeof o.price === 'number' ? o.price : undefined,
      available: o.available !== false,
    }));

  return normalized.length > 0 ? normalized : undefined;
}

// Raw fetch function for items (throws on error)
const fetchItemsRaw = async (): Promise<MenuItem[]> => {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qItems));
  const mapped = raw.map((i: Record<string, unknown>) => ({
    id: i._id,
    name: i.name,
    slug: i.slug,
    categorySlug: i.categorySlug,
    description: i.description ?? undefined,
    price: i.basePrice ?? null,
    badges: Array.isArray(i.badges) ? i.badges.filter(isBadge) : undefined,
    image: i.image ?? undefined,
    availableEverywhere: i.availableEverywhere ?? false,
    allowSpecialInstructions: i.allowSpecialInstructions ?? true,
    locationOverrides: normalizeOverrides(
      Array.isArray(i.overrides)
        ? i.overrides as { loc: string; price?: number; available?: boolean }[]
        : undefined
    ),
    modifierGroups: normalizeModifierGroups(i.modifierGroups),
    itemModifierOverrides: normalizeItemModifierOverrides(i.itemModifierOverrides),
  }));
  return z.array(ItemSchema).parse(mapped) as MenuItem[];
};

// Circuit-breaker protected fetch
const fetchItemsProtected = withCircuitBreaker(
  'sanity-items',
  fetchItemsRaw,
  () => demoItems,
  SANITY_CIRCUIT_OPTIONS
);

const fetchItems = async (): Promise<MenuItem[]> => {
  if (!client) {
    return demoItems;
  }
  return fetchItemsProtected();
};

const getItemsCached = unstable_cache(
  fetchItems,
  ['sanity-items'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.items, CACHE_TAGS.all],
  }
);

export const adapter: BrandAdapter = {
  brandName: "The Catch Houston (CMS)",
  async getCategories(): Promise<MenuCategory[]> {
    return getCategoriesCached();
  },
  async getLocations(): Promise<Location[]> {
    return getLocationsCached();
  },
  async getItems(): Promise<MenuItem[]> {
    return getItemsCached();
  },
  async getLocationBySlug(slug: string) {
    if (!client) {
      return demoLocations.find(loc => loc.slug === slug);
    }
    try {
      const one = await withTimeout(client.fetch(
        groq`*[_type=="location" && slug.current==$s][0]{ _id, name, "slug": slug.current, addressLine1, addressLine2, city, state, postalCode, phone, hours, menuUrl, directionsUrl, revelUrl, doordashUrl, uberEatsUrl, "heroImage": heroImage.asset->url, "geo": geo }`,
        { s: slug }
      ));
      if (!one) return undefined;
      const parsed = LocationSchema.parse(one);
      return {
        _id: parsed._id,
        name: parsed.name,
        slug: parsed.slug,
        addressLine1: parsed.addressLine1 ?? '',
        city: parsed.city ?? '',
        state: parsed.state ?? '',
        postalCode: parsed.postalCode ?? '',
        addressLine2: parsed.addressLine2 ?? undefined,
        phone: parsed.phone ?? undefined,
        revelUrl: parsed.revelUrl ?? parsed.menuUrl ?? undefined,
        doordashUrl: parsed.doordashUrl ?? undefined,
        uberEatsUrl: parsed.uberEatsUrl ?? undefined,
        menuUrl: parsed.menuUrl ?? undefined,
        directionsUrl: parsed.directionsUrl ?? undefined,
        heroImage: parsed.heroImage ?? fallbackHero(parsed.slug),
        openToday: !!parsed.hours,
        hours: parsed.hours,
        geo: parsed.geo ?? fallbackGeoCoordinates[parsed.slug] ?? undefined
      };
    } catch (error) {
      console.warn("Falling back to demo location", slug, error instanceof Error ? error.message : error);
      return demoLocations.find(loc => loc.slug === slug);
    }
  },
  async getItemsByCategory(slug: string) {
    const all = await this.getItems();
    return all.filter(i => i.categorySlug === slug);
  }
};
