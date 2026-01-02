import { defineField, defineType } from "sanity";
import { SlidersHorizontal } from "lucide-react";

/**
 * Modifier Option - Individual choice within a modifier group
 * e.g., "Ranch", "MED +$11.49", "Fries"
 */
export const modifierOption = defineType({
  name: "modifierOption",
  title: "Modifier Option",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price Adjustment",
      type: "number",
      description: "Additional cost (e.g., 1.49 for +$1.49). Leave empty for no extra charge.",
    }),
    defineField({
      name: "isDefault",
      title: "Default Selection",
      type: "boolean",
      description: "Pre-select this option by default",
      initialValue: false,
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      description: "Uncheck to temporarily disable this option",
      initialValue: true,
    }),
    defineField({
      name: "calories",
      title: "Calories",
      type: "number",
      description: "Calorie count for this option (optional)",
    }),
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      available: "available",
    },
    prepare({ title, price, available }) {
      const priceStr = price ? ` +$${price.toFixed(2)}` : "";
      const availStr = available === false ? " (unavailable)" : "";
      return {
        title: `${title}${priceStr}${availStr}`,
      };
    },
  },
});

/**
 * Modifier Group - A category of options for a menu item
 * e.g., "Size", "Dressing", "One Side", "Add Ons"
 *
 * These can be shared across multiple menu items (e.g., "Dressing" used by salads and baskets)
 */
export default defineType({
  name: "modifierGroup",
  title: "Modifier Group",
  type: "document",
  icon: SlidersHorizontal,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Display name (e.g., 'Size', 'Dressing', 'One Side')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      description: "Unique identifier for this modifier group",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      description: "Help text shown to customers (optional)",
    }),
    defineField({
      name: "required",
      title: "Required",
      type: "boolean",
      description: "Customer must make a selection",
      initialValue: false,
    }),
    defineField({
      name: "multiSelect",
      title: "Allow Multiple Selections",
      type: "boolean",
      description: "Customer can select more than one option (e.g., Add Ons)",
      initialValue: false,
    }),
    defineField({
      name: "minSelections",
      title: "Minimum Selections",
      type: "number",
      description: "For multi-select: minimum number of choices required",
      hidden: ({ parent }) => !parent?.multiSelect,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "maxSelections",
      title: "Maximum Selections",
      type: "number",
      description: "For multi-select: maximum number of choices allowed",
      hidden: ({ parent }) => !parent?.multiSelect,
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [{ type: "modifierOption" }],
      validation: (rule) => rule.min(1).error("At least one option is required"),
    }),
    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      description: "Order in which this group appears (lower = first)",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "displayOrderAsc",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
    {
      title: "Name",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      required: "required",
      multiSelect: "multiSelect",
      options: "options",
    },
    prepare({ title, required, multiSelect, options }) {
      const reqStr = required ? "Required" : "Optional";
      const typeStr = multiSelect ? "Multi-select" : "Single-select";
      const count = options?.length || 0;
      return {
        title,
        subtitle: `${reqStr} · ${typeStr} · ${count} options`,
      };
    },
  },
});
