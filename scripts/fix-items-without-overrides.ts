/**
 * Add Houston location overrides to items without any location overrides
 * These items should only be available at Houston locations, not DFW
 */
import { getSanityClient } from "../lib/sanity-config";
import path from "path";

const client = getSanityClient("2025-11-22");

// Configurable default source (can be overridden via env var)
const DEFAULT_SOURCE = process.env.DEFAULT_ITEM_SOURCE || "revel";

const HOUSTON_LOCATION_REFS = [
  "loc-conroe",
  "loc-atascocita",
  "loc-s-post-oak",
  "loc-willowbrook",
];

async function main() {
  console.log("Fixing items without location overrides...\n");

  // Find items without location overrides (available everywhere)
  const itemsWithoutOverrides = await client.fetch<Array<{
    _id: string;
    name: string;
    source?: string;
    basePrice?: number;
  }>>(
    `*[_type == "menuItem" && (!defined(locationOverrides) || count(locationOverrides) == 0)] {
      _id, name, source, basePrice
    }`
  );

  console.log(`Found ${itemsWithoutOverrides.length} items without location overrides\n`);

  for (const item of itemsWithoutOverrides) {
    // Add location overrides for all 4 Houston locations
    const locationOverrides: any[] = [];
    for (const refId of HOUSTON_LOCATION_REFS) {
      locationOverrides.push({
        _type: "locationOverride",
        _key: `${refId.replace("loc-", "")}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        location: { _type: "reference", _ref: refId },
        price: item.basePrice || null,
        available: true,
      });
    }

    // Build patch payload: preserve existing source or use default
    const patchPayload: any = { locationOverrides };
    
    // Only set source if item doesn't have one or if we want to provide a fallback
    if (!item.source) {
      patchPayload.source = DEFAULT_SOURCE;
    }

    await client.patch(item._id).set(patchPayload).commit();

    console.log(`Added Houston overrides to: ${item.name}`);
  }

  console.log(`\n✅ Successfully updated ${itemsWithoutOverrides.length} items!`);

  // Verify final counts
  const dfwItems = await client.fetch(`count(*[_type == "menuItem" && source == "dfw"])`);
  const revelItems = await client.fetch(`count(*[_type == "menuItem" && source == "revel"])`);
  const noOverrides = await client.fetch(
    `count(*[_type == "menuItem" && (!defined(locationOverrides) || count(locationOverrides) == 0)])`
  );

  console.log(`\nFinal counts:`);
  console.log(`  DFW items: ${dfwItems}`);
  console.log(`  Revel items: ${revelItems}`);
  console.log(`  Items without overrides: ${noOverrides}`);
}

main().catch(console.error);
