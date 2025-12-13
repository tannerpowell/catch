/**
 * Migration Script: Populate menu availability for remaining 9 locations
 *
 * Uses thecatchseafood.com menu image data to set available=true
 * for matching items at locations without Revel/Owner.com data.
 *
 * Locations to populate:
 * - arlington, burleson, longview, lubbock, tyler, wichita-falls
 * - okc-memorial, midwest-city, moore
 *
 * Usage:
 *   npx tsx scripts/migrate-remaining-locations.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrate-remaining-locations.ts --apply      # Apply to Sanity
 */

import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: path.resolve(".env.local") });

// Locations that need menu data (no Revel/Owner.com source)
const REMAINING_LOCATIONS = [
  "arlington",
  "burleson",
  "longview",
  "lubbock",
  "tyler",
  "wichita-falls",
  "okc-memorial",
  "midwest-city",
  "moore",
];

// Keywords/patterns from thecatchseafood.com menu image
// These will be used for substring matching against Sanity item names
const MENU_KEYWORDS = [
  // Core proteins - these appear in many combo names
  "catfish",
  "shrimp",
  "oyster",
  "gator",
  "crawfish",
  "snow crab",
  "chicken tender",
  "tenders",
  "whitefish",
  // Soups & Starters
  "gumbo",
  "etouffee",
  "étouffée",
  "fried pickles",
  "fried green tomatoes",
  "boudin",
  // Salads
  "house salad",
  "caesar salad",
  "side salad",
  // Pasta
  "pasta",
  "alfredo",
  // Po Boys
  "po' boy",
  "po boy",
  // Baskets
  "basket",
  // Boiled
  "boiled",
  "catch boil",
  // Sides
  "white rice",
  "corn",
  "potatoes",
  "catch fries",
  "fries",
  "tots",
  "coleslaw",
  "cole slaw",
  "fried okra",
  "red beans",
  "sausage",
  "hush puppies",
  "dirty rice",
  "mac & cheese",
  // Desserts
  "cookie",
  "banana pudding",
  "key lime",
  "beignets",
  "cheesecake",
  // Drinks
  "drink",
  "water",
  // Kids
  "kids",
  // Other common items
  "combo",
  "big easy",
  "cajun special",
  "admiral",
  "captain",
];

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[éè]/g, "e") // Normalize accents
    .replace(/\./g, "")
    .replace(/[()]/g, "")
    .replace(/'/g, "'") // Normalize apostrophes
    .replace(/\s+/g, " ")
    .trim();
}

// Check if item name matches any menu keyword
function itemMatchesMenu(itemName: string): boolean {
  const normalized = normalizeItemName(itemName);

  // Skip "Add" items - these are modifiers, not standalone menu items
  if (normalized.startsWith("add ")) return false;

  // Skip side items like "Side Butter", "Dipping Sauce"
  if (normalized.startsWith("side butter") || normalized === "dipping sauce" || normalized === "dips") return false;

  // Skip utility items
  if (normalized === "lemons" || normalized === "egg" || normalized === "boiled egg" || normalized === "cup of ice") return false;
  if (normalized === "garlic butter" || normalized === "bowl of butter" || normalized === "cup of butter") return false;
  if (normalized === "extra belgian waffle" || normalized === "extra garlic bread" || normalized === "extra tender") return false;
  if (normalized === "single" || normalized === "double") return false;

  // Check if any keyword appears in the item name
  return MENU_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()));
}

async function main() {
  const isDryRun = !process.argv.includes("--apply");

  console.log("=".repeat(60));
  console.log("Migration: Populate Remaining 9 Locations from Menu Image");
  console.log("=".repeat(60));
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "APPLY (writing to Sanity)"}\n`);
  console.log(`Locations to populate: ${REMAINING_LOCATIONS.join(", ")}`);
  console.log(`Menu keywords for matching: ${MENU_KEYWORDS.length}\n`);

  // Connect to Sanity
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

  // Fetch all menu items and locations
  console.log("Fetching Sanity data...");
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

  // Build location ID map (only for remaining locations)
  const locationIdMap = new Map<string, string>();
  const locationNameMap = new Map<string, string>();
  locations.forEach((l) => {
    if (REMAINING_LOCATIONS.includes(l.slug.current)) {
      locationIdMap.set(l.slug.current, l._id);
      locationNameMap.set(l.slug.current, l.name);
    }
  });

  console.log(`Found ${locationIdMap.size} of ${REMAINING_LOCATIONS.length} target locations in Sanity`);

  // Build mutations
  const mutations: Array<{ patch: { id: string; set: Record<string, unknown> } }> = [];
  let matchedItems = 0;
  let unmatchedItems = 0;
  const unmatchedNames: string[] = [];

  for (const item of menuItems) {
    // Check if this item matches any menu keyword
    if (!itemMatchesMenu(item.name)) {
      unmatchedItems++;
      unmatchedNames.push(item.name);
      continue;
    }

    matchedItems++;

    // Get existing overrides
    const existingOverrides = item.locationOverrides || [];

    // Build map of existing overrides by location ID
    const existingByLocId = new Map<
      string,
      { _key: string; price?: number; available?: boolean }
    >();
    existingOverrides.forEach((ov) => {
      if (ov.location?._ref) {
        existingByLocId.set(ov.location._ref, {
          _key: ov._key,
          price: ov.price,
          available: ov.available,
        });
      }
    });

    // Check if we need to add any new locations
    const newOverrides = [...existingOverrides];
    let hasChanges = false;

    for (const locSlug of REMAINING_LOCATIONS) {
      const locId = locationIdMap.get(locSlug);
      if (!locId) continue;

      // Skip if already has override for this location
      if (existingByLocId.has(locId)) continue;

      // Add new override for this location
      newOverrides.push({
        _key: Math.random().toString(36).slice(2, 10),
        _type: "locationOverride",
        location: { _type: "reference", _ref: locId },
        available: true,
      } as typeof existingOverrides[0]);
      hasChanges = true;
    }

    if (hasChanges) {
      mutations.push({
        patch: {
          id: item._id,
          set: {
            locationOverrides: newOverrides,
          },
        },
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Items matched from image menu: ${matchedItems}`);
  console.log(`Items not on image menu (unchanged): ${unmatchedItems}`);
  console.log(`Total mutations to apply: ${mutations.length}`);

  // Show sample mutations
  if (mutations.length > 0) {
    console.log("\nSample mutations (first 5):");
    const sample = mutations.slice(0, 5);
    for (const mut of sample) {
      const item = menuItems.find((i) => i._id === mut.patch.id);
      console.log(`  - "${item?.name}"`);
    }
  }

  // Show unmatched items
  if (unmatchedNames.length > 0) {
    console.log("\nUnmatched items (excluded from migration):");
    unmatchedNames.forEach((n) => console.log(`  - ${n}`));
  }

  // Apply or dry-run
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
