/**
 * Remove all Revel-sourced menu items from DFW locations
 * Keep only the DFW-sourced items (97 items total)
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
  useCdn: false,
});

async function main() {
  console.log("Cleaning DFW menu items...\n");

  const DFW_LOCATION_REFS = ["loc-denton", "loc-garland", "loc-coit-campbell"];

  // Get all menu items that have locationOverrides for DFW locations
  const itemsWithDfwOverrides = await client.fetch<Array<{
    _id: string;
    name: string;
    source?: string;
    locationOverrides?: Array<{
      _key: string;
      location: { _ref: string };
    }>;
  }>>(
    `*[_type == "menuItem" && defined(locationOverrides) && count(locationOverrides[location._ref in ["loc-denton", "loc-garland", "loc-coit-campbell"]]) > 0] {
      _id, name, source, locationOverrides
    }`
  );

  console.log(`Found ${itemsWithDfwOverrides.length} items with DFW location overrides\n`);

  let removedCount = 0;
  let updatedCount = 0;

  for (const item of itemsWithDfwOverrides) {
    // If item is sourced from Revel, remove DFW location overrides
    if (item.source === "revel") {
      const nonDfwOverrides = item.locationOverrides?.filter(
        (o) => !DFW_LOCATION_REFS.includes(o.location._ref)
      ) || [];

      if (nonDfwOverrides.length > 0) {
        // Update to remove DFW overrides
        await client.patch(item._id).set({ locationOverrides: nonDfwOverrides }).commit();
        console.log(`Removed DFW overrides from: ${item.name}`);
        updatedCount++;
      } else {
        // No other overrides, delete the item entirely
        await client.delete(item._id);
        console.log(`Deleted Revel item (DFW only): ${item.name}`);
        removedCount++;
      }
    }
    // DFW-sourced items are kept as-is
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`  Updated: ${updatedCount} items (removed DFW overrides)`);
  console.log(`  Deleted: ${removedCount} items (Revel items that were DFW-only)`);

  // Verify final counts
  const dfwItemCount = await client.fetch(`count(*[_type == "menuItem" && source == "dfw"])`);
  const revelItemCount = await client.fetch(`count(*[_type == "menuItem" && source == "revel"])`);

  console.log(`\nFinal item counts:`);
  console.log(`  DFW items: ${dfwItemCount}`);
  console.log(`  Revel items: ${revelItemCount}`);

  // Test item counts per location
  console.log(`\nItems per location:`);
  const locations = await client.fetch<Array<{ slug: { current: string }; name: string }>>(
    `*[_type == "location"] | order(name asc) { "slug": slug.current, name }`
  );

  const allItems = await client.fetch<Array<{
    locationOverrides?: Array<{ location: { _ref: string } }>;
  }>>(`*[_type == "menuItem"] { locationOverrides }`);

  for (const location of locations) {
    const locationRef = `loc-${location.slug}`;
    const itemsAtLocation = allItems.filter(item => {
      if (!item.locationOverrides || item.locationOverrides.length === 0) {
        return true; // Available everywhere
      }
      return item.locationOverrides.some(o => o.location._ref === locationRef);
    });

    console.log(`  ${location.name}: ${itemsAtLocation.length} items`);
  }
}

main().catch(console.error);
