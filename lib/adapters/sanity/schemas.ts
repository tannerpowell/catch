import { z } from "zod";
import { BADGE_OPTIONS, type Badge } from "@/lib/constants/badges";

const badgeSet = new Set<Badge>(BADGE_OPTIONS);
export const isBadge = (value: unknown): value is Badge =>
  typeof value === "string" && badgeSet.has(value as Badge);

export const BadgeSchema = z.enum(BADGE_OPTIONS);

export const GeoPointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180)
}).nullable().optional();

export const RegionSchema = z.enum(["dfw", "houston", "oklahoma", "east-tx", "west-tx"]).nullable().optional();

export const LocationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  region: RegionSchema,
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hours: z.any().nullable().optional(),
  revelUrl: z.string().url().nullable().optional(),
  doordashUrl: z.string().url().nullable().optional(),
  uberEatsUrl: z.string().url().nullable().optional(),
  menuUrl: z.string().url().nullable().optional(),
  directionsUrl: z.string().url().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  geo: GeoPointSchema
});

export const CategorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  position: z.number().nullable().optional(),
  description: z.string().nullable().optional()
});

export const ModifierOptionSchema = z.object({
  _key: z.string(),
  name: z.string(),
  price: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
  available: z.boolean().optional(),
  calories: z.number().nullable().optional()
});

export const ModifierGroupSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  required: z.boolean().default(false),
  multiSelect: z.boolean().default(false),
  minSelections: z.number().nullable().optional(),
  maxSelections: z.number().nullable().optional(),
  options: z.array(ModifierOptionSchema).optional(),
  displayOrder: z.number().nullable().optional()
});

export const ItemModifierOverrideSchema = z.object({
  _key: z.string(),
  modifierGroupId: z.string(),
  optionName: z.string(),
  price: z.number().nullable().optional(),
  available: z.boolean().optional()
});

export const ItemSchema = z.object({
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
