/**
 * Verify all locations in Sanity
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-08-01",
  useCdn: false, // Important: don't use CDN for real-time data
});

async function main() {
  const locations = await client.fetch(
    `*[_type == "location"] | order(name asc) { _id, "slug": slug.current, name, storeId }`
  );

  console.log(`Found ${locations.length} locations in Sanity:\n`);
  locations.forEach((loc: any, i: number) => {
    console.log(`${i + 1}. ${loc.slug}: ${loc.name} (storeId: ${loc.storeId || 'none'})`);
  });
}

main().catch(console.error);
