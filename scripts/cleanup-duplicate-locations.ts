/**
 * Delete duplicate store-* locations from Sanity and keep only the 7 real locations.
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error("Missing Sanity environment variables");
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-08-01",
  useCdn: false,
});

async function main() {
  console.log("Fetching all locations...");

  const locations = await client.fetch<Array<{ _id: string; slug: { current: string }; name: string }>>(
    `*[_type == "location"] { _id, slug, name }`
  );

  console.log(`Found ${locations.length} locations:`);
  locations.forEach(loc => console.log(`  - ${loc.slug.current}: ${loc.name}`));

  // Locations to keep (the 4 Houston + we'll add 3 DFW later)
  const validSlugs = ['atascocita', 'conroe', 's-post-oak', 'willowbrook', 'dfw'];

  const toDelete = locations.filter(loc => !validSlugs.includes(loc.slug.current));

  if (toDelete.length === 0) {
    console.log("\nNo duplicate locations to delete.");
    return;
  }

  console.log(`\nDeleting ${toDelete.length} duplicate locations:`);
  toDelete.forEach(loc => console.log(`  - ${loc.slug.current}: ${loc.name}`));

  for (const loc of toDelete) {
    console.log(`Deleting ${loc.slug.current}...`);
    await client.delete(loc._id);
  }

  console.log("\nDone! Deleted duplicate locations.");
}

main().catch(console.error);
