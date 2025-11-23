import { defineField, defineType } from "sanity";
export default defineType({
  name: "menuCategory",
  title: "Menu Category",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "position", type: "number" }),
    defineField({ name: "description", type: "text" })
  ]
});
