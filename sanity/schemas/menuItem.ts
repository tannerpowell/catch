import { defineField, defineType } from "sanity";

export const priceVariant = defineType({
  name: "priceVariant",
  title: "Price Variant",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string" }),
    defineField({ name: "price", type: "number" })
  ]
});

export const locationOverride = defineType({
  name: "locationOverride",
  title: "Location Override",
  type: "object",
  fields: [
    { name: "location", type: "reference", to: [{ type: "location" }] },
    { name: "price", type: "number" },
    { name: "available", type: "boolean" }
  ]
});

export default defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string" }),
    defineField({ name: "slug", type: "slug", options: { source: "name" } }),
    defineField({ name: "category", type: "reference", to: [{ type: "menuCategory" }] }),
    defineField({ name: "description", type: "text" }),
    defineField({ name: "basePrice", type: "number" }),
    defineField({
      name: "priceVariants",
      title: "Price Variants (e.g., cup/bowl)",
      type: "array",
      of: [{ type: "priceVariant" }]
    }),
    defineField({ name: "badges", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "image", type: "image" }),
    defineField({ name: "imageUrl", type: "url", description: "Source image URL (for re-use/migration)" }),
    defineField({ name: "externalId", type: "string", description: "Source product ID (e.g., Revel)" }),
    defineField({ name: "storeId", type: "number", description: "Source store ID (if store-specific)" }),
    defineField({
      name: "source",
      type: "string",
      options: { list: ["revel", "dfw", "manual"] }
    }),
    defineField({ name: "lastSyncedAt", type: "datetime" }),
    defineField({
      name: "locationOverrides",
      title: "Per‑location Overrides",
      type: "array",
      of: [{ type: "locationOverride" }]
    })
  ],
  preview: {
    select: { title: "name", subtitle: "source" }
  }
});
