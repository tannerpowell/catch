import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "menuCategory",
  title: "Menu Category",
  type: "document",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" }
    }),
    defineField({
      name: "position",
      type: "number",
      title: "Sort Order",
      description: "Lower numbers appear first"
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2
    })
  ],
  orderings: [
    {
      title: "Position",
      name: "positionAsc",
      by: [{ field: "position", direction: "asc" }]
    }
  ],
  preview: {
    select: {
      title: "title",
      position: "position"
    },
    prepare({ title, position }) {
      return {
        title,
        subtitle: position != null ? `#${position}` : "No position"
      };
    }
  }
});
