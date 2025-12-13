/**
 * Link Modifier Groups to Menu Items
 *
 * Assigns modifier groups to menu items based on their category.
 * Run this AFTER seed-modifier-groups.ts
 *
 * Usage: npx tsx scripts/link-modifiers-to-items.ts [--dry-run]
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2025-10-01",
  useCdn: false,
});

const isDryRun = process.argv.includes("--dry-run");

/**
 * CATEGORY TO MODIFIER MAPPING
 * Maps category slugs to modifier group IDs
 */
const CATEGORY_MODIFIERS: Record<string, string[]> = {
  // Main entree categories
  "baskets": ["mod-size-basket", "mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],
  "combos": ["mod-size-basket", "mod-preparation", "mod-side-choice", "mod-second-side", "mod-dressing", "mod-add-ons"],
  "off-menu-combos": ["mod-size-basket", "mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],

  // Sandwiches & handheld
  "po-boys": ["mod-bread", "mod-preparation", "mod-dressing", "mod-add-ons"],
  "poboys": ["mod-bread", "mod-preparation", "mod-dressing", "mod-add-ons"],
  "po-boys-tacos-sandwiches": ["mod-bread", "mod-preparation", "mod-dressing", "mod-add-ons"],
  "tacos": ["mod-taco-quantity", "mod-preparation", "mod-add-ons"],
  "sandwiches": ["mod-bread", "mod-dressing", "mod-add-ons"],

  // Salads
  "salads": ["mod-salad-dressing", "mod-add-ons"],

  // Boiled seafood
  "boiled": ["mod-boil-seasoning", "mod-boil-extras"],
  "boiled-favorites": ["mod-boil-seasoning", "mod-boil-extras"],

  // House favorites / specialties
  "house-favorites": ["mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],
  "favorites": ["mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],
  "cajun-creation": ["mod-preparation", "mod-side-choice", "mod-dressing"],

  // Kids
  "kids-meals": ["mod-kids-side", "mod-kids-drink"],
  "kids": ["mod-kids-side", "mod-kids-drink"],
  "kids-meal": ["mod-kids-side", "mod-kids-drink"],

  // Drinks
  "drinks": ["mod-drink-size"],
  "beverages": ["mod-drink-size"],

  // Starters - just dressing for dipping
  "starters": ["mod-dressing"],
  "appetizers": ["mod-dressing"],

  // A la carte items
  "a-la-carte": ["mod-preparation"],

  // No modifiers for these
  "sides": [],
  "desserts": [],
  "dips": [],
  "family-packs": [],
  "family-size-deals": [],
};

/**
 * ITEM-SPECIFIC OVERRIDES
 * Some items need special modifier configurations
 */
const ITEM_OVERRIDES: Record<string, { modifiers?: string[]; exclude?: string[] }> = {
  // Swamp Fries/Tots needs special base choice
  "swamp-fries-tots": { modifiers: ["mod-swamp-base", "mod-add-ons"] },
  "swamp-fries": { modifiers: ["mod-swamp-base", "mod-add-ons"] },

  // Gumbo doesn't need size/prep
  "gumbo": { modifiers: ["mod-add-ons"] },
  "seafood-gumbo": { modifiers: ["mod-add-ons"] },

  // Desserts that might have options
  "beignets": { modifiers: [] },
  "banana-pudding": { modifiers: [] },
  "key-lime-pie": { modifiers: [] },

  // Boiled shrimp by weight
  "boiled-shrimp": { modifiers: ["mod-boil-seasoning", "mod-boil-extras"] },
  "boiled-shrimp-by-lb": { modifiers: ["mod-boil-seasoning", "mod-boil-extras"] },
  "snow-crab": { modifiers: ["mod-boil-seasoning", "mod-boil-extras"] },
  "crab-legs": { modifiers: ["mod-boil-seasoning", "mod-boil-extras"] },

  // Already customized items (like Bang Bang shrimp)
  "bang-bang-shrimp": { modifiers: ["mod-add-ons"] },
};

interface MenuItem {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  currentModifiers: string[];
}

async function main() {
  console.log("=== Link Modifier Groups to Menu Items ===\n");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);

  // Verify modifier groups exist
  const modifierGroups = await client.fetch(`*[_type == "modifierGroup"]{ _id, name }`);
  console.log(`Found ${modifierGroups.length} modifier groups in Sanity\n`);

  if (modifierGroups.length === 0) {
    console.error("❌ No modifier groups found! Run seed-modifier-groups.ts first.");
    process.exit(1);
  }

  const modifierMap = new Map(modifierGroups.map((g: { _id: string; name: string }) => [g._id, g.name]));

  // Get all menu items with their categories
  const items: MenuItem[] = await client.fetch(`
    *[_type == "menuItem"] {
      _id,
      name,
      "slug": slug.current,
      "categorySlug": category->slug.current,
      "currentModifiers": modifierGroups[]->_id
    }
  `);

  console.log(`Found ${items.length} menu items\n`);

  // Group items by category for summary
  const categoryGroups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const cat = item.categorySlug || "uncategorized";
    if (!categoryGroups.has(cat)) {
      categoryGroups.set(cat, []);
    }
    categoryGroups.get(cat)!.push(item);
  }

  // Process each item
  let updatedCount = 0;
  let skippedCount = 0;

  const updates: Array<{ item: MenuItem; modifierIds: string[] }> = [];

  for (const item of items) {
    const categorySlug = item.categorySlug || "";

    // Check for item-specific override first
    let modifierIds: string[] = [];

    if (ITEM_OVERRIDES[item.slug]) {
      const override = ITEM_OVERRIDES[item.slug];
      if (override.modifiers) {
        modifierIds = override.modifiers;
      } else if (override.exclude && CATEGORY_MODIFIERS[categorySlug]) {
        modifierIds = CATEGORY_MODIFIERS[categorySlug].filter(id => !override.exclude!.includes(id));
      }
    } else if (CATEGORY_MODIFIERS[categorySlug]) {
      modifierIds = CATEGORY_MODIFIERS[categorySlug];
    }

    // Filter to only modifiers that exist
    modifierIds = modifierIds.filter(id => modifierMap.has(id));

    // Check if update is needed
    const currentIds = (item.currentModifiers || []).sort();
    const newIds = [...modifierIds].sort();
    const needsUpdate = JSON.stringify(currentIds) !== JSON.stringify(newIds);

    if (needsUpdate && modifierIds.length > 0) {
      updates.push({ item, modifierIds });
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  // Show summary by category
  console.log("=== Changes by Category ===\n");
  for (const [category, categoryItems] of categoryGroups) {
    const modifierIds = CATEGORY_MODIFIERS[category] || [];
    const modifierNames = modifierIds.map(id => modifierMap.get(id) || id);

    const itemsToUpdate = updates.filter(u => u.item.categorySlug === category).length;

    if (itemsToUpdate > 0 || modifierIds.length > 0) {
      console.log(`${category} (${categoryItems.length} items, ${itemsToUpdate} to update):`);
      if (modifierNames.length > 0) {
        console.log(`  → ${modifierNames.join(", ")}`);
      } else {
        console.log(`  → (no modifiers)`);
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Items to update: ${updatedCount}`);
  console.log(`Items skipped (no change needed): ${skippedCount}`);

  if (!isDryRun && updates.length > 0) {
    console.log(`\nApplying updates...`);

    // Batch updates using transactions
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      const transaction = client.transaction();
      for (const { item, modifierIds } of batch) {
        transaction.patch(item._id, {
          set: {
            modifierGroups: modifierIds.map(id => ({
              _type: "reference",
              _ref: id,
              _key: `${id}-${Date.now()}`
            }))
          }
        });
      }

      await transaction.commit();
      console.log(`  Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}`);
    }

    console.log(`\n✅ Successfully updated ${updates.length} menu items`);
  } else if (isDryRun) {
    console.log(`\nDry run complete. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\nNo updates needed.`);
  }

  // Show sample items for verification
  console.log("\n=== Sample Items After Update ===\n");
  const sampleCategories = ["baskets", "po-boys", "salads", "kids-meals"];
  for (const cat of sampleCategories) {
    const catItems = updates.filter(u => u.item.categorySlug === cat).slice(0, 2);
    if (catItems.length > 0) {
      console.log(`${cat}:`);
      for (const { item, modifierIds } of catItems) {
        const names = modifierIds.map(id => modifierMap.get(id) || id);
        console.log(`  - ${item.name}: ${names.join(", ")}`);
      }
    }
  }
}

main().catch(console.error);
