/**
 * Migration Script: Flip from Opt-Out to Opt-In
 *
 * This script:
 * 1. Reads Owner.com scraped data for Houston 4 locations
 * 2. Reads Revel data for DFW locations
 * 3. For each item with matching name, sets available=true for source locations
 *
 * Usage:
 *   npx tsx scripts/migrate-to-opt-in.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrate-to-opt-in.ts --apply      # Apply to Sanity
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: path.resolve(".env.local") });

// Revel store ID to location slug mapping
const REVEL_STORE_MAP: Record<number, string> = {
  1: "conroe",
  2: "atascocita",
  4: "garland",
  5: "s-post-oak",
  72: "denton",
  105: "willowbrook",
  110: "coit-campbell",
};

// Houston locations that use Owner.com menu
const HOUSTON_LOCATIONS = ["conroe", "s-post-oak", "willowbrook", "atascocita"];

// DFW locations from Revel
const DFW_LOCATIONS = ["denton", "garland", "coit-campbell"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Normalize item name for matching
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "") // Remove periods
    .replace(/[()]/g, "") // Remove parentheses
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

interface OwnerScrapedData {
  url: string;
  scrapedAt: string;
  images: Array<{ src: string; alt: string; text: string }>;
}

interface RevelItem {
  name: string;
  price: number | null;
  isAvailable: boolean;
}

interface RevelCategory {
  category: string;
  items: RevelItem[];
}

interface RevelStore {
  storeId: number;
  categories: RevelCategory[];
}

async function main() {
  const isDryRun = !process.argv.includes("--apply");

  console.log("=".repeat(60));
  console.log("Migration: Flip to Opt-In Menu Availability Model");
  console.log("=".repeat(60));
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "APPLY (writing to Sanity)"}\n`);

  // 1. Load Owner.com data (Houston locations)
  const ownerDataPath = path.resolve("data/menus/owner-menu-20251212.json");
  let ownerItemNames: Set<string> = new Set();

  if (fs.existsSync(ownerDataPath)) {
    const ownerData: OwnerScrapedData = JSON.parse(fs.readFileSync(ownerDataPath, "utf-8"));
    ownerData.images.forEach((img) => {
      if (img.alt && img.alt !== "The Catch - Houston") {
        // Clean up alt text: "Cajun Special." -> "cajun special"
        const cleanName = img.alt.replace(/\.$/, "").trim();
        ownerItemNames.add(normalizeItemName(cleanName));
      }
    });
    console.log(`Loaded ${ownerItemNames.size} unique items from Owner.com (Houston menu)`);
  } else {
    console.log("⚠️  Owner.com data not found at", ownerDataPath);
  }

  // 2. Load Revel data (DFW locations)
  const revelDir = path.resolve("data/menus/revel");
  const revelItemsByStore = new Map<string, Set<string>>();

  if (fs.existsSync(revelDir)) {
    for (const storeDir of fs.readdirSync(revelDir)) {
      const storeMatch = storeDir.match(/store-(\d+)/);
      if (!storeMatch) continue;

      const storeId = parseInt(storeMatch[1]);
      const locationSlug = REVEL_STORE_MAP[storeId];
      if (!locationSlug) continue;

      // Only process DFW locations from Revel
      if (!DFW_LOCATIONS.includes(locationSlug)) continue;

      const jsonPath = path.join(revelDir, storeDir, `${storeDir}.json`);
      if (!fs.existsSync(jsonPath)) continue;

      const data: RevelStore = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const itemNames = new Set<string>();

      for (const category of data.categories || []) {
        for (const item of category.items || []) {
          if (item.isAvailable) {
            itemNames.add(normalizeItemName(item.name));
          }
        }
      }

      revelItemsByStore.set(locationSlug, itemNames);
      console.log(`Loaded ${itemNames.size} items from Revel for ${locationSlug}`);
    }
  } else {
    console.log("⚠️  Revel data directory not found at", revelDir);
  }

  // 3. Connect to Sanity
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing Sanity env vars (NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_WRITE_TOKEN)");
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2024-08-01",
    useCdn: false,
  });

  // 4. Fetch all menu items and locations
  console.log("\nFetching Sanity data...");
  const [menuItems, locations] = await Promise.all([
    client.fetch<
      Array<{
        _id: string;
        name: string;
        slug?: { current: string };
        locationOverrides?: Array<{
          _key: string;
          location?: { _ref: string };
          price?: number;
          available?: boolean;
        }>;
      }>
    >(`*[_type == "menuItem"]{ _id, name, slug, locationOverrides }`),
    client.fetch<Array<{ _id: string; slug: { current: string }; name: string }>>(
      `*[_type == "location"]{ _id, slug, name }`
    ),
  ]);

  console.log(`Found ${menuItems.length} menu items and ${locations.length} locations in Sanity`);

  // Build location ID map
  const locationIdMap = new Map<string, string>();
  const locationNameMap = new Map<string, string>();
  locations.forEach((l) => {
    locationIdMap.set(l.slug.current, l._id);
    locationNameMap.set(l.slug.current, l.name);
  });

  // 5. Build mutations
  const mutations: Array<{ patch: { id: string; set: Record<string, unknown> } }> = [];
  let matchedItems = 0;
  let unmatchedItems = 0;

  for (const item of menuItems) {
    const itemNameNorm = normalizeItemName(item.name);
    const itemSlug = item.slug?.current || slugify(item.name);

    // Determine which locations this item should be available at
    const availableAtLocations: string[] = [];

    // Check Houston locations (Owner.com)
    if (ownerItemNames.has(itemNameNorm)) {
      availableAtLocations.push(...HOUSTON_LOCATIONS);
    }

    // Check DFW locations (Revel)
    for (const [locSlug, itemSet] of revelItemsByStore) {
      if (itemSet.has(itemNameNorm)) {
        availableAtLocations.push(locSlug);
      }
    }

    if (availableAtLocations.length === 0) {
      unmatchedItems++;
      continue;
    }

    matchedItems++;

    // Build new locationOverrides array
    const newOverrides: Array<{
      _key: string;
      _type: string;
      location: { _type: string; _ref: string };
      price?: number;
      available: boolean;
    }> = [];

    // Get existing overrides to preserve prices
    const existingOverrides = item.locationOverrides || [];
    const existingByLoc = new Map<string, { price?: number }>();
    existingOverrides.forEach((ov) => {
      if (ov.location?._ref) {
        const loc = locations.find((l) => l._id === ov.location!._ref);
        if (loc) {
          existingByLoc.set(loc.slug.current, { price: ov.price });
        }
      }
    });

    // Create overrides for available locations
    for (const locSlug of availableAtLocations) {
      const locId = locationIdMap.get(locSlug);
      if (!locId) continue;

      const existing = existingByLoc.get(locSlug);

      newOverrides.push({
        _key: Math.random().toString(36).slice(2, 10),
        _type: "locationOverride",
        location: { _type: "reference", _ref: locId },
        price: existing?.price,
        available: true,
      });
    }

    mutations.push({
      patch: {
        id: item._id,
        set: {
          locationOverrides: newOverrides,
        },
      },
    });
  }

  // 6. Summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Items matched to locations: ${matchedItems}`);
  console.log(`Items with no matches (will be hidden everywhere): ${unmatchedItems}`);
  console.log(`Total mutations to apply: ${mutations.length}`);

  // Show sample mutations
  if (mutations.length > 0) {
    console.log("\nSample mutations (first 3):");
    const sample = mutations.slice(0, 3);
    for (const mut of sample) {
      const item = menuItems.find((i) => i._id === mut.patch.id);
      const locs = (mut.patch.set.locationOverrides as Array<{ location: { _ref: string } }>)
        .map((ov) => {
          const loc = locations.find((l) => l._id === ov.location._ref);
          return loc?.slug.current || "unknown";
        })
        .join(", ");
      console.log(`  - "${item?.name}" -> available at: ${locs}`);
    }
  }

  // 7. Apply or dry-run
  if (isDryRun) {
    console.log("\n🔍 DRY RUN - No changes made. Use --apply to write to Sanity.");
  } else {
    console.log("\n⏳ Applying mutations to Sanity...");
    const chunkSize = 50;
    for (let i = 0; i < mutations.length; i += chunkSize) {
      const chunk = mutations.slice(i, i + chunkSize);
      const transaction = client.transaction();
      chunk.forEach((mut) => transaction.patch(mut.patch.id, { set: mut.patch.set }));
      await transaction.commit();
      process.stdout.write(".");
    }
    console.log("\n✅ Done! Migration complete.");
  }
}

main().catch(console.error);
