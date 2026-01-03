import { defineField, defineType } from "sanity";
import { LocationOverridesInput, LocationOverridesField } from "../components/LocationOverridesInput";
import { Utensils, DollarSign, Settings2, Image, Layers } from "lucide-react";

export const priceVariant = defineType({
  name: "priceVariant",
  title: "Price Variant",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", title: "Size/Option" }),
    defineField({ name: "price", type: "number", title: "Price" })
  ],
  preview: {
    select: { label: "label", price: "price" },
    prepare({ label, price }) {
      return {
        title: label || "Untitled",
        subtitle: price != null ? `$${price.toFixed(2)}` : "—"
      };
    }
  }
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
      description: "Exact name to override (e.g., 'MED', 'Ranch')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price Override",
      type: "number",
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
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
  icon: Utensils,
  groups: [
    { name: "pricing", title: "Price & Availability", icon: DollarSign, default: true },
    { name: "modifiers", title: "Modifiers", icon: Layers },
    { name: "media", title: "Media", icon: Image },
    { name: "content", title: "Content", icon: Utensils },
    { name: "advanced", title: "Advanced", icon: Settings2 },
  ],
  fieldsets: [
    { name: "title", options: { columns: 2 } },
    { name: "priceRow", title: "Pricing", options: { columns: 2 } },
  ],
  fields: [
    // ============ CONTENT GROUP ============
    defineField({
      name: "name",
      type: "string",
      group: "content",
      fieldset: "title",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      group: "content",
      fieldset: "title",
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "menuCategory" }],
      group: "content",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      group: "content",
    }),
    defineField({
      name: "badges",
      type: "array",
      of: [{ type: "string" }],
      group: "content",
      options: {
        layout: "tags"
      }
    }),

    // ============ PRICING GROUP ============
    defineField({
      name: "locationOverrides",
      title: " ", // Minimal title - we render our own header
      type: "array",
      of: [{ type: "locationOverride" }],
      components: {
        input: LocationOverridesInput,
        field: LocationOverridesField,
      },
      group: "pricing",
    }),
    defineField({
      name: "basePrice",
      title: "Base Price",
      type: "number",
      group: "pricing",
      fieldset: "priceRow",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "availableEverywhere",
      title: "Available Everywhere",
      type: "boolean",
      description: "Override: show at all locations regardless of above",
      group: "pricing",
      fieldset: "priceRow",
      initialValue: false,
    }),
    defineField({
      name: "priceVariants",
      title: "Price Variants",
      type: "array",
      of: [{ type: "priceVariant" }],
      description: "Size options (cup/bowl)",
      group: "pricing",
    }),

    // ============ MODIFIERS GROUP ============
    defineField({
      name: "modifierGroups",
      title: "Modifier Groups",
      type: "array",
      of: [{ type: "reference", to: [{ type: "modifierGroup" }] }],
      description: "Customization options (Size, Dressing, Sides, Add-Ons)",
      group: "modifiers",
    }),
    defineField({
      name: "itemModifierOverrides",
      title: "Item-Specific Overrides",
      type: "array",
      of: [{ type: "itemModifierOverride" }],
      description: "Override modifier prices for this item only",
      group: "modifiers",
    }),
    defineField({
      name: "allowSpecialInstructions",
      title: "Allow Special Instructions",
      type: "boolean",
      description: "Show special instructions field for this item",
      group: "modifiers",
      initialValue: true,
    }),

    // ============ MEDIA GROUP ============
    defineField({
      name: "image",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "Alt text" })
      ]
    }),
    defineField({
      name: "imageUrl",
      type: "url",
      title: "Source Image URL",
      description: "Original URL for re-importing",
      group: "media",
    }),

    // ============ ADVANCED GROUP ============
    defineField({
      name: "externalId",
      type: "string",
      title: "External ID",
      description: "Source product ID (e.g., Revel)",
      group: "advanced",
    }),
    defineField({
      name: "storeId",
      type: "number",
      title: "Store ID",
      description: "Source store ID (if store-specific)",
      group: "advanced",
    }),
    defineField({
      name: "source",
      type: "string",
      options: { list: ["revel", "dfw", "manual"], layout: "radio", direction: "horizontal" },
      group: "advanced",
    }),
    defineField({
      name: "lastSyncedAt",
      type: "datetime",
      title: "Last Synced",
      group: "advanced",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      category: "category.title",
      price: "basePrice",
      media: "image"
    },
    prepare({ title, category, price, media }) {
      const priceStr = price != null ? `$${price.toFixed(2)}` : "";
      const subtitle = [category, priceStr].filter(Boolean).join(" · ");
      return {
        title,
        subtitle,
        media
      };
    }
  }
});
