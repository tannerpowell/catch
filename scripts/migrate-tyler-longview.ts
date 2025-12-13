/**
 * Migration Script: Update Tyler and Longview menus from Olo data
 *
 * This replaces the generic thecatchseafood.com menu with the actual
 * Olo menu used by Tyler and Longview locations.
 *
 * Usage:
 *   npx tsx scripts/migrate-tyler-longview.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrate-tyler-longview.ts --apply      # Apply to Sanity
 */

import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: path.resolve(".env.local") });

const TARGET_LOCATIONS = ["tyler", "longview"];

// Keywords from Olo Tyler/Longview menu for matching
const OLO_MENU_KEYWORDS = [
  // Core proteins
  "catfish",
  "shrimp",
  "oyster",
  "gator",
  "crawfish",
  "crab",
  "whitefish",
  "chicken tender",
  "tenders",
  "fish",
  // Soups & Apps
  "gumbo",
  "queso",
  "fried green tomatoes",
  "onion rings",
  "hush puppies",
  "fried pickles",
  "garlic bread",
  "fried jalapeno",
  // Salads
  "house salad",
  "salad",
  "remoulade",
  // Baskets
  "basket",
  // Combos
  "combo",
  "catch 22",
  "admiral",
  // Po Boys
  "poboy",
  "po boy",
  "po' boy",
  // Tacos
  "taco",
  // Boiled / Grilled
  "boiled",
  "grilled",
  // Sides
  "fries",
  "vegetables",
  "red beans",
  "rice",
  "corn",
  "sweet pot",
  "mushrooms",
  "cole slaw",
  "coleslaw",
  "fried okra",
  "potato",
  "side salad",
  "side queso",
  "grits",
  "sausage",
  // Kids
  "kids",
  // Desserts
  "banana pudding",
  "key lime",
  "beignets",
  // Drinks
  "drink",
  "water",
];

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[éè]/g, "e")
    .replace(/\./g, "")
    .replace(/[()]/g, "")
    .replace(/'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function itemMatchesOloMenu(itemName: string): boolean {
  const normalized = normalizeItemName(itemName);

  // Skip "Add" items
  if (normalized.startsWith("add ")) return false;

  // Skip side butter, dipping sauce, utility items
  if (normalized.startsWith("side butter")) return false;
  if (normalized === "dipping sauce" || normalized === "dips") return false;
  if (normalized === "lemons" || normalized === "egg" || normalized === "boiled egg") return false;
  if (normalized === "cup of ice" || normalized === "garlic butter") return false;
  if (normalized === "bowl of butter" || normalized === "cup of butter") return false;
  if (normalized === "extra belgian waffle" || normalized === "extra garlic bread") return false;
  if (normalized === "extra tender" || normalized === "single" || normalized === "double") return false;

  // Check if any keyword appears in the item name
  return OLO_MENU_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

async function main() {
  const isDryRun = !process.argv.includes("--apply");

  console.log("=".repeat(60));
  console.log("Migration: Update Tyler & Longview from Olo Menu");
  console.log("=".repeat(60));
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "APPLY (writing to Sanity)"}\n`);
  console.log(`Locations: ${TARGET_LOCATIONS.join(", ")}\n`);

  // Connect to Sanity
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing Sanity env vars");
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2024-08-01",
    useCdn: false,
  });

  // Fetch data
  console.log("Fetching Sanity data...");
  const [menuItems, locations] = await Promise.all([
    client.fetch<
      Array<{
        _id: string;
        name: string;
        locationOverrides?: Array<{
          _key: string;
          location?: { _ref: string };
          price?: number;
          available?: boolean;
        }>;
      }>
    >(`*[_type == "menuItem"]{ _id, name, locationOverrides }`),
    client.fetch<Array<{ _id: string; slug: { current: string }; name: string }>>(
      `*[_type == "location"]{ _id, slug, name }`
    ),
  ]);

  console.log(`Found ${menuItems.length} menu items and ${locations.length} locations\n`);

  // Build location ID map for target locations
  const locationIdMap = new Map<string, string>();
  locations.forEach((l) => {
    if (TARGET_LOCATIONS.includes(l.slug.current)) {
      locationIdMap.set(l.slug.current, l._id);
      console.log(`Target: ${l.name} (${l._id})`);
    }
  });

  // Process items
  const mutations: Array<{ patch: { id: string; set: Record<string, unknown> } }> = [];
  let itemsToEnable = 0;
  let itemsToDisable = 0;
  const enabledItems: string[] = [];
  const disabledItems: string[] = [];

  for (const item of menuItems) {
    const matchesOlo = itemMatchesOloMenu(item.name);
    const existingOverrides = item.locationOverrides || [];

    // Build map of existing overrides
    const existingByLocId = new Map<string, { _key: string; price?: number; available?: boolean }>();
    existingOverrides.forEach((ov) => {
      if (ov.location?._ref) {
        existingByLocId.set(ov.location._ref, {
          _key: ov._key,
          price: ov.price,
          available: ov.available,
        });
      }
    });

    // Check if we need to update Tyler/Longview
    let hasChanges = false;
    const newOverrides = [...existingOverrides];

    for (const locSlug of TARGET_LOCATIONS) {
      const locId = locationIdMap.get(locSlug);
      if (!locId) continue;

      const existing = existingByLocId.get(locId);

      if (matchesOlo) {
        // Item should be available
        if (!existing) {
          // Add new override
          newOverrides.push({
            _key: Math.random().toString(36).slice(2, 10),
            _type: "locationOverride",
            location: { _type: "reference", _ref: locId },
            available: true,
          } as typeof existingOverrides[0]);
          hasChanges = true;
        } else if (existing.available !== true) {
          // Update existing to available
          const idx = newOverrides.findIndex(
            (ov) => ov.location?._ref === locId
          );
          if (idx >= 0) {
            newOverrides[idx] = { ...newOverrides[idx], available: true };
            hasChanges = true;
          }
        }
      } else {
        // Item should NOT be available at these locations
        if (existing && existing.available === true) {
          // Remove or set to unavailable
          const idx = newOverrides.findIndex(
            (ov) => ov.location?._ref === locId
          );
          if (idx >= 0) {
            // Remove this override entirely
            newOverrides.splice(idx, 1);
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      mutations.push({
        patch: {
          id: item._id,
          set: { locationOverrides: newOverrides },
        },
      });

      if (matchesOlo) {
        itemsToEnable++;
        enabledItems.push(item.name);
      } else {
        itemsToDisable++;
        disabledItems.push(item.name);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Items to enable at Tyler/Longview: ${itemsToEnable}`);
  console.log(`Items to disable at Tyler/Longview: ${itemsToDisable}`);
  console.log(`Total mutations: ${mutations.length}`);

  if (disabledItems.length > 0 && disabledItems.length <= 30) {
    console.log("\nItems being disabled (not on Olo menu):");
    disabledItems.forEach((n) => console.log(`  - ${n}`));
  }

  // Apply
  if (isDryRun) {
    console.log("\n🔍 DRY RUN - No changes made. Use --apply to write to Sanity.");
  } else if (mutations.length > 0) {
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
  } else {
    console.log("\n✅ No changes needed.");
  }
}

main().catch(console.error);
