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

/**
 * Item-specific modifier override
 * Allows overriding price or availability of a modifier option for THIS item only
 * e.g., "MED" size costs $11.49 for Whitefish Basket but $9.99 for Catfish Basket
 */
export const itemModifierOverride = defineType({
  name: "itemModifierOverride",
  title: "Item Modifier Override",
  type: "object",
  fields: [
    defineField({
      name: "modifierGroup",
      title: "Modifier Group",
      type: "reference",
      to: [{ type: "modifierGroup" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "optionName",
      title: "Option Name",
      type: "string",
      description: "The exact name of the option to override (e.g., 'MED', 'Ranch')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price Override",
      type: "number",
      description: "Override price for this option on this item",
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      description: "Override availability for this option on this item",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      group: "modifierGroup.name",
      option: "optionName",
      price: "price",
    },
    prepare({ group, option, price }) {
      const priceStr = price !== undefined ? ` → $${price.toFixed(2)}` : "";
      return {
        title: `${option}${priceStr}`,
        subtitle: group,
      };
    },
  },
});

export default defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  fieldsets: [
    { name: "basics", title: "Basics", options: { collapsed: false, columns: 2 } },
    { name: "pricing", title: "Pricing", options: { collapsed: false, columns: 2 } },
    { name: "modifiers", title: "Modifiers & Options", options: { collapsed: false } },
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
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "menuCategory" }],
      fieldset: "basics",
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
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "priceVariants",
      title: "Price Variants (e.g., cup/bowl)",
      type: "array",
      of: [{ type: "priceVariant" }],
      description: "Simple size/portion options with fixed prices. For complex options, use Modifier Groups below.",
      fieldset: "pricing",
    }),
    // Modifier Groups - for online ordering customization
    defineField({
      name: "modifierGroups",
      title: "Modifier Groups",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "modifierGroup" }],
        },
      ],
      description: "Customization options like Size, Dressing, Sides, Add-Ons. Shared groups can be reused across items.",
      fieldset: "modifiers",
    }),
    defineField({
      name: "itemModifierOverrides",
      title: "Item-Specific Modifier Overrides",
      type: "array",
      of: [{ type: "itemModifierOverride" }],
      description: "Override prices or availability for specific modifiers on THIS item only (e.g., different size prices)",
      fieldset: "modifiers",
    }),
    defineField({
      name: "allowSpecialInstructions",
      title: "Allow Special Instructions",
      type: "boolean",
      description: "Show 'Special Instructions' text field for this item",
      initialValue: true,
      fieldset: "modifiers",
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
      name: "availableEverywhere",
      title: "Available Everywhere",
      type: "boolean",
      description: "Show at ALL locations (for drinks, sides, etc.). When off, item only shows where explicitly enabled below.",
      initialValue: false,
      fieldset: "pricing",
    }),
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
