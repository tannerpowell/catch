/**
 * Test menu filtering to verify items are correctly filtered by location
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-08-01",
  useCdn: false,
});

async function main() {
  console.log("Testing menu filtering...\n");

  const locations = await client.fetch<Array<{ slug: { current: string }; name: string }>>(
    `*[_type == "location"] | order(name asc) { "slug": slug.current, name }`
  );

  const allItems = await client.fetch<Array<{
    name: string;
    locationOverrides?: Array<{ location: { _ref: string } }>;
  }>>(
    `*[_type == "menuItem"] { name, locationOverrides }`
  );

  console.log(`Total items in database: ${allItems.length}\n`);

  for (const location of locations) {
    const locationRef = `loc-${location.slug}`;

    // Count items available at this location
    const itemsAtLocation = allItems.filter(item => {
      // If no location overrides, available everywhere
      if (!item.locationOverrides || item.locationOverrides.length === 0) {
        return true;
      }
      // Check if this location has an override
      return item.locationOverrides.some(o => o.location._ref === locationRef);
    });

    console.log(`${location.name} (${location.slug}): ${itemsAtLocation.length} items`);
  }

  // Check for items without any location overrides
  const itemsWithoutOverrides = allItems.filter(
    item => !item.locationOverrides || item.locationOverrides.length === 0
  );

  console.log(`\nItems available at ALL locations: ${itemsWithoutOverrides.length}`);

  // Check Houston vs DFW items
  const dfwItems = await client.fetch(`count(*[_type == "menuItem" && source == "dfw"])`);
  const revelItems = await client.fetch(`count(*[_type == "menuItem" && source == "revel"])`);

  console.log(`\nSource breakdown:`);
  console.log(`  DFW items: ${dfwItems}`);
  console.log(`  Revel items: ${revelItems}`);
  console.log(`  Other/no source: ${allItems.length - dfwItems - revelItems}`);
}

main().catch(console.error);
