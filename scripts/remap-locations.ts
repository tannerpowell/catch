/**
 * Remap menu items from store-* locations to proper location slugs
 * and then delete the duplicate store-* locations.
 *
 * Store ID mapping (based on Revel data):
 * - Store 1: Conroe
 * - Store 2: Willowbrook
 * - Store 4: Atascocita
 * - Store 5: South Post Oak
 * - Store 72, 105, 110: Unknown (to be deleted)
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

// Map store IDs to location slugs (from Locations.csv)
const STORE_ID_MAP: Record<number, string> = {
  1: 'conroe',
  2: 'atascocita',
  4: 'garland',      // DFW location
  5: 's-post-oak',
  72: 'denton',      // DFW location
  105: 'willowbrook',
  110: 'coit-campbell', // DFW location (will create this slug)
};

async function main() {
  console.log("Step 1: Fetching all locations...");
  const locations = await client.fetch<Array<{ _id: string; slug: { current: string }; name: string; storeId?: number }>>(
    `*[_type == "location"] { _id, slug, name, storeId }`
  );

  console.log(`Found ${locations.length} locations:`);
  locations.forEach(loc => console.log(`  - ${loc.slug.current}: ${loc.name} (storeId: ${loc.storeId || 'none'})`));

  // Create a map from old location IDs to new location IDs
  const locationIdMap = new Map<string, string>();

  locations.forEach(loc => {
    if (loc.slug.current.startsWith('store-')) {
      // Extract store number from slug (e.g., "store-5-post-oak" -> 5, "store-1" -> 1)
      const match = loc.slug.current.match(/store-(\d+)/);
      if (match) {
        const storeId = parseInt(match[1]);
        const targetSlug = STORE_ID_MAP[storeId];
        if (targetSlug) {
          const targetLoc = locations.find(l => l.slug.current === targetSlug);
          if (targetLoc) {
            locationIdMap.set(loc._id, targetLoc._id);
            console.log(`  Mapping ${loc.slug.current} (${loc._id}) -> ${targetSlug} (${targetLoc._id})`);
          }
        }
      }
    }
  });

  console.log(`\nStep 2: Updating menu items to use correct location references...`);

  // Get all menu items
  const menuItems = await client.fetch<Array<{
    _id: string;
    name: string;
    locationOverrides?: Array<{
      _key: string;
      location: { _ref: string };
      price?: number;
      available?: boolean;
    }>;
  }>>(
    `*[_type == "menuItem"] { _id, name, locationOverrides }`
  );

  console.log(`Found ${menuItems.length} menu items`);

  let updateCount = 0;
  const chunkSize = 50;

  for (let i = 0; i < menuItems.length; i += chunkSize) {
    const chunk = menuItems.slice(i, i + chunkSize);
    const transaction = client.transaction();

    for (const item of chunk) {
      if (!item.locationOverrides || item.locationOverrides.length === 0) {
        continue;
      }

      const updatedOverrides = item.locationOverrides.map(override => {
        const newLocationId = locationIdMap.get(override.location._ref);
        if (newLocationId) {
          updateCount++;
          return {
            ...override,
            location: { _type: 'reference', _ref: newLocationId }
          };
        }
        return override;
      });

      // Only update if something changed
      if (JSON.stringify(updatedOverrides) !== JSON.stringify(item.locationOverrides)) {
        transaction.patch(item._id, { set: { locationOverrides: updatedOverrides } });
      }
    }

    await transaction.commit();
    process.stdout.write('.');
  }

  console.log(`\n  Updated ${updateCount} location references`);

  console.log(`\nStep 3: Deleting duplicate store-* locations...`);

  const duplicateLocations = locations.filter(loc =>
    loc.slug.current.startsWith('store-') && locationIdMap.has(loc._id)
  );

  for (const loc of duplicateLocations) {
    console.log(`  Deleting ${loc.slug.current}...`);
    await client.delete(loc._id);
  }

  console.log(`\nDone! Remapped locations and deleted ${duplicateLocations.length} duplicates.`);
}

main().catch(console.error);
