import { createClient } from "@sanity/client";
import groq from "groq";
import type { Badge, BrandAdapter, Location, MenuCategory, MenuItem } from "@/lib/types";
import { demoCategories, demoItems, demoLocations } from "@/lib/adapters/demo-data";
import { z } from "zod";
import { cache } from "react";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const hasSanityConfig = Boolean(projectId && dataset);

const client = hasSanityConfig
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion: "2025-10-01",
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

const HoursSchema = z
  .object({
    sunday: z.string().optional(),
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional()
  })
  .optional();

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
  heroImage: z.string().nullable().optional() // Remove .url() validation
});

const CategorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  position: z.number().nullable().optional(),
  description: z.string().nullable().optional()
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
  locationOverrides: z
    .record(z.string(), z.object({ price: z.number().nullable().optional(), available: z.boolean().optional() }))
    .optional()
});

const qCategories = groq`*[_type=="menuCategory"]|order(position asc){ "slug": slug.current, title, position, description }`;
const qLocations = groq`*[_type=="location"]{ _id, name, "slug": slug.current, addressLine1, addressLine2, city, state, postalCode, phone, hours, revelUrl, doordashUrl, uberEatsUrl, menuUrl, directionsUrl, "heroImage": heroImage.asset->url }`;
const qItems = groq`*[_type=="menuItem"]{ _id, name, "slug": slug.current, description, "categorySlug": category->slug.current, "image": image.asset->url, badges, "basePrice": coalesce(basePrice, null), "overrides": coalesce(locationOverrides, [])[]{ "loc": location->slug.current, price, available } }`;

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

// Cached data fetching functions - prevents duplicate requests in the same render
const getCategoriesCached = cache(async (): Promise<MenuCategory[]> => {
  if (!client) {
    return demoCategories;
  }
  try {
    const raw = await client.fetch(qCategories);
    const parsed = z.array(CategorySchema).parse(raw);
    return parsed.map(cat => ({
      ...cat,
      description: cat.description ?? undefined,
      position: cat.position ?? undefined
    }));
  } catch (error) {
    console.warn("Falling back to demo categories", error instanceof Error ? error.message : error);
    return demoCategories;
  }
});

const getLocationsCached = cache(async (): Promise<Location[]> => {
  if (!client) {
    return demoLocations;
  }
  try {
    const raw = await client.fetch(qLocations);
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
      openToday: !!l.hours
    }));
  } catch (error) {
    console.warn("Falling back to demo locations", error instanceof Error ? error.message : error);
    return demoLocations;
  }
});

const getItemsCached = cache(async (): Promise<MenuItem[]> => {
  if (!client) {
    return demoItems;
  }
  try {
    const raw = await client.fetch(qItems);
    const mapped = raw.map((i: any) => ({
      id: i._id,
      name: i.name,
      slug: i.slug,
      categorySlug: i.categorySlug,
      description: i.description ?? undefined,
      price: i.basePrice ?? null,
      badges: Array.isArray(i.badges) ? i.badges.filter(isBadge) : undefined,
      image: i.image ?? undefined,
      locationOverrides: normalizeOverrides(i.overrides)
    }));
    return z.array(ItemSchema).parse(mapped) as MenuItem[];
  } catch (error) {
    console.warn("Falling back to demo items", error instanceof Error ? error.message : error);
    return demoItems;
  }
});

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
      const one = await client.fetch(
        groq`*[_type=="location" && slug.current==$s][0]{ _id, name, "slug": slug.current, addressLine1, addressLine2, city, state, postalCode, phone, hours, menuUrl, directionsUrl }`,
        { s: slug }
      );
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
        openToday: false,
        hours: parsed.hours
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
