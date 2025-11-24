import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

const missingVars: string[] = [];
if (!projectId) missingVars.push("NEXT_PUBLIC_SANITY_PROJECT_ID");
if (!dataset) missingVars.push("NEXT_PUBLIC_SANITY_DATASET");

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Sanity environment variables:\n  ${missingVars.join("\n  ")}\n\n` +
    "Please ensure these are set in your .env.local file."
  );
}

export default defineConfig({
  name: "catch-studio",
  title: "The Catch CMS",
  projectId: projectId as string,
  dataset: dataset as string,
  basePath: "/studio",
  plugins: [structureTool()],
  schema: { types: schemaTypes }
});
