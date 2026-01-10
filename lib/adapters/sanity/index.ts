import { z } from "zod";
import { unstable_cache } from "next/cache";
import type { BrandAdapter, Location, MenuCategory, MenuItem } from "@/lib/types";
import { withTimeout } from "@/lib/sanity/constants";
import { withCircuitBreaker } from "@/lib/utils/circuit-breaker";
import { demoCategories, demoItems, demoLocations } from "@/lib/adapters/demo-data";

import { client } from "./client";
import { qCategories, qLocations, qItems, qLocationBySlug } from "./queries";
import { LocationSchema, CategorySchema, ItemSchema, isBadge } from "./schemas";
import { normalizeOverrides, normalizeModifierGroups, normalizeItemModifierOverrides } from "./normalizers";
import {
  CACHE_REVALIDATE_SECONDS,
  CACHE_TAGS,
  SANITY_CIRCUIT_OPTIONS,
  fallbackHero,
  fallbackGeoCoordinates
} from "./constants";

// Re-export for backwards compatibility
export { CACHE_TAGS, fallbackGeoCoordinates };

// --- Categories ---

async function fetchCategoriesRaw(): Promise<MenuCategory[]> {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qCategories));
  const parsed = z.array(CategorySchema).parse(raw);
  return parsed.map((cat) => ({
    ...cat,
    description: cat.description ?? undefined,
    position: cat.position ?? undefined,
  }));
}

const fetchCategoriesProtected = withCircuitBreaker(
  'sanity-categories',
  fetchCategoriesRaw,
  () => demoCategories,
  SANITY_CIRCUIT_OPTIONS
);

async function fetchCategories(): Promise<MenuCategory[]> {
  if (!client) return demoCategories;
  return fetchCategoriesProtected();
}

const getCategoriesCached = unstable_cache(
  fetchCategories,
  ['sanity-categories'],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.categories, CACHE_TAGS.all] }
);

// --- Locations ---

async function fetchLocationsRaw(): Promise<Location[]> {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qLocations));
  const parsed = z.array(LocationSchema).parse(raw);
  return parsed.map((l) => ({
    _id: l._id,
    name: l.name,
    slug: l.slug,
    region: l.region ?? undefined,
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
    geo: l.geo ?? fallbackGeoCoordinates[l.slug] ?? undefined,
  }));
}

const fetchLocationsProtected = withCircuitBreaker(
  'sanity-locations',
  fetchLocationsRaw,
  () => demoLocations,
  SANITY_CIRCUIT_OPTIONS
);

async function fetchLocations(): Promise<Location[]> {
  if (!client) return demoLocations;
  return fetchLocationsProtected();
}

const getLocationsCached = unstable_cache(
  fetchLocations,
  ['sanity-locations'],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.locations, CACHE_TAGS.all] }
);

// --- Items ---

async function fetchItemsRaw(): Promise<MenuItem[]> {
  if (!client) throw new Error('Sanity client not configured');
  const raw = await withTimeout(client.fetch(qItems));
  if (!Array.isArray(raw)) {
    throw new Error('Expected Sanity items query to return an array');
  }
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
        ? i.overrides as { loc: string; price?: number | null; available?: boolean }[]
        : undefined
    ),
    modifierGroups: normalizeModifierGroups(i.modifierGroups),
    itemModifierOverrides: normalizeItemModifierOverrides(i.itemModifierOverrides),
  }));
  return z.array(ItemSchema).parse(mapped);
}

const fetchItemsProtected = withCircuitBreaker(
  'sanity-items',
  fetchItemsRaw,
  () => demoItems,
  SANITY_CIRCUIT_OPTIONS
);

async function fetchItems(): Promise<MenuItem[]> {
  if (!client) return demoItems;
  return fetchItemsProtected();
}

const getItemsCached = unstable_cache(
  fetchItems,
  ['sanity-items'],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.items, CACHE_TAGS.all] }
);

// --- Adapter ---

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
      const one = await withTimeout(client.fetch(qLocationBySlug, { s: slug }));
      if (!one) return undefined;
      const parsed = LocationSchema.parse(one);
      return {
        _id: parsed._id,
        name: parsed.name,
        slug: parsed.slug,
        region: parsed.region ?? undefined,
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
    const all = await getItemsCached();
    return all.filter(i => i.categorySlug === slug);
  }
};
