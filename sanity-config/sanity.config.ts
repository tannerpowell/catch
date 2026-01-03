import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";
import { structure } from "./structure";
import { menuManager } from "./plugins/menu-manager";
import { apiVersion, dataset, projectId } from "./env";

export default defineConfig({
  name: "catch-studio",
  title: "The Catch CMS",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    menuManager(),
    // Vision is for querying with GROQ from inside the Studio
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: { types: schemaTypes },
  document: {
    // Prevent accidental deletion/duplication of menu items and categories
    actions: (prev, context) => {
      if (["menuItem", "menuCategory"].includes(context.schemaType)) {
        return prev.filter(
          (action) => action.action !== "delete" && action.action !== "duplicate"
        );
      }
      return prev;
    },
  },
});
