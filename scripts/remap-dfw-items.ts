/**
 * Remap menu items from the old "dfw" location to all 3 DFW locations
 * (denton, garland, coit-campbell)
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
  console.log("Remapping items from 'dfw' to 3 DFW locations...\n");

  // Get all menu items with dfw location overrides
  const items = await client.fetch<Array<{
    _id: string;
    name: string;
    locationOverrides?: Array<{
      _key: string;
      location: { _ref: string };
      price?: number;
      available?: boolean;
    }>;
  }>>(
    `*[_type == "menuItem" && defined(locationOverrides) && "location-dfw" in locationOverrides[].location._ref] { _id, name, locationOverrides }`
  );

  console.log(`Found ${items.length} items with dfw location overrides`);

  if (items.length === 0) {
    console.log("No items to remap.");
    return;
  }

  const chunkSize = 50;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const transaction = client.transaction();

    for (const item of chunk) {
      // Find the DFW override
      const dfwOverride = item.locationOverrides?.find(
        (o) => o.location._ref === "location-dfw"
      );

      if (!dfwOverride) continue;

      // Remove dfw override and add 3 DFW location overrides
      const otherOverrides = item.locationOverrides?.filter(
        (o) => o.location._ref !== "location-dfw"
      ) || [];

      const newOverrides = [
        ...otherOverrides,
        {
          _type: "locationOverride",
          _key: `denton-${Date.now()}`,
          location: { _type: "reference", _ref: "loc-denton" },
          price: dfwOverride.price,
          available: dfwOverride.available ?? true,
        },
        {
          _type: "locationOverride",
          _key: `garland-${Date.now()}`,
          location: { _type: "reference", _ref: "loc-garland" },
          price: dfwOverride.price,
          available: dfwOverride.available ?? true,
        },
        {
          _type: "locationOverride",
          _key: `coit-campbell-${Date.now()}`,
          location: { _type: "reference", _ref: "loc-coit-campbell" },
          price: dfwOverride.price,
          available: dfwOverride.available ?? true,
        },
      ];

      transaction.patch(item._id, { set: { locationOverrides: newOverrides } });
    }

    await transaction.commit();
    process.stdout.write('.');
  }

  console.log(`\n\n✅ Remapped ${items.length} items from 'dfw' to 3 DFW locations`);

  // Now try to delete the dfw location
  try {
    await client.delete("location-dfw");
    console.log("✅ Deleted old 'dfw' placeholder location");
  } catch (err: any) {
    console.error("⚠️  Could not delete dfw location:", err.message);
  }

  // Final verification
  const finalLocations = await client.fetch(
    `*[_type == "location"] | order(name asc) { slug, name, storeId }`
  );

  console.log(`\n✅ Final ${finalLocations.length} locations:`);
  finalLocations.forEach((loc: any) => {
    console.log(`  - ${loc.slug.current}: ${loc.name} (storeId: ${loc.storeId || 'none'})`);
  });
}

main().catch(console.error);
