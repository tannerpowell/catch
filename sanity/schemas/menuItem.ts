import { defineField, defineType } from "sanity";
import { LocationOverridesInput } from "../components/LocationOverridesInput";

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
  fieldsets: [
    { name: "basics", title: "Basics", options: { collapsed: false, columns: 2 } },
    { name: "pricing", title: "Pricing", options: { collapsed: false, columns: 2 } },
    { name: "media", title: "Media", options: { collapsed: true } },
    { name: "advanced", title: "Advanced", options: { collapsed: true } },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      fieldset: "basics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      fieldset: "basics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "menuCategory" }],
      fieldset: "basics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      fieldset: "basics",
    }),
    defineField({
      name: "basePrice",
      title: "Base price",
      type: "number",
      fieldset: "pricing",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "priceVariants",
      title: "Price Variants (e.g., cup/bowl)",
      type: "array",
      of: [{ type: "priceVariant" }]
    }),
    defineField({ name: "badges", type: "array", of: [{ type: "string" }], fieldset: "basics" }),
    defineField({
      name: "image",
      type: "image",
      fieldset: "media",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "Alt text" })
      ]
    }),
    defineField({ name: "imageUrl", type: "url", description: "Source image URL (for re-use/migration)", fieldset: "advanced" }),
    defineField({ name: "externalId", type: "string", description: "Source product ID (e.g., Revel)", fieldset: "advanced" }),
    defineField({ name: "storeId", type: "number", description: "Source store ID (if store-specific)", fieldset: "advanced" }),
    defineField({
      name: "source",
      type: "string",
      options: { list: ["revel", "dfw", "manual"] },
      fieldset: "advanced",
    }),
    defineField({ name: "lastSyncedAt", type: "datetime", fieldset: "advanced" }),
    defineField({
      name: "locationOverrides",
      title: "Per‑location Overrides",
      type: "array",
      of: [{ type: "locationOverride" }],
      components: { input: LocationOverridesInput },
      fieldset: "pricing",
    })
  ],
  preview: {
    select: { title: "name", subtitle: "source" }
  }
});
