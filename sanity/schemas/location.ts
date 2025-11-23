import { defineField, defineType } from "sanity";

export default defineType({
  name: "location",
  title: "Location",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "storeId",
      type: "number",
      description: "External store ID (e.g., Revel store)",
      validation: (rule) => rule.required().integer().min(1)
    }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({
        name: "alt",
        type: "string",
        title: "Alt text",
        validation: (rule) => rule.required()
      })],
      description: "Background image used on the menu page"
    }),
    defineField({
      name: "addressLine1",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({ name: "addressLine2", type: "string" }),
    defineField({
      name: "city",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "state",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "postalCode",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "phone",
      type: "string",
      validation: (rule) =>
        rule.required().min(10).regex(/^[\d\s\-\(\)\+]+$/, {
          name: "phone format",
          invert: false
        })
    }),
    defineField({
      name: "hours",
      type: "object",
      fields: [
        { name: "sunday", type: "string" },
        { name: "monday", type: "string" },
        { name: "tuesday", type: "string" },
        { name: "wednesday", type: "string" },
        { name: "thursday", type: "string" },
        { name: "friday", type: "string" },
        { name: "saturday", type: "string" }
      ]
    }),
    defineField({ name: "menuUrl", type: "url" }),
    defineField({ name: "directionsUrl", type: "url" })
  ]
});
