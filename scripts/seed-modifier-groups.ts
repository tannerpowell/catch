/**
 * Seed Modifier Groups for The Catch Menu
 *
 * Based on observed menu patterns across all locations:
 * - Houston (Conroe, S Post Oak, Willowbrook, Atascocita)
 * - DFW (Denton, Garland, Coit-Campbell)
 * - Tyler/Longview (OLO)
 * - Oklahoma locations
 *
 * Usage: npx tsx scripts/seed-modifier-groups.ts [--dry-run]
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

interface ModifierOption {
  _key: string;
  name: string;
  price?: number;
  isDefault?: boolean;
  available?: boolean;
}

interface ModifierGroup {
  _id: string;
  _type: "modifierGroup";
  name: string;
  slug: { _type: "slug"; current: string };
  description?: string;
  required: boolean;
  multiSelect: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
  displayOrder: number;
}

// Generate a unique key for options
const key = (prefix: string, index: number) => `${prefix}-${Date.now()}-${index}`;

/**
 * MODIFIER GROUPS DEFINITION
 * Based on The Catch menu across all locations
 */
const MODIFIER_GROUPS: ModifierGroup[] = [
  // ============================================
  // SIZE OPTIONS (for Baskets, Combos)
  // ============================================
  {
    _id: "mod-size-basket",
    _type: "modifierGroup",
    name: "Size",
    slug: { _type: "slug", current: "size" },
    description: "Choose your portion size",
    required: true,
    multiSelect: false,
    displayOrder: 1,
    options: [
      { _key: key("sz", 0), name: "Regular", price: 0, isDefault: true, available: true },
      { _key: key("sz", 1), name: "Medium", price: 4.00, available: true },
      { _key: key("sz", 2), name: "Large", price: 8.00, available: true },
    ],
  },

  // ============================================
  // PREPARATION STYLE
  // ============================================
  {
    _id: "mod-preparation",
    _type: "modifierGroup",
    name: "Preparation",
    slug: { _type: "slug", current: "preparation" },
    description: "How would you like it prepared?",
    required: true,
    multiSelect: false,
    displayOrder: 2,
    options: [
      { _key: key("prep", 0), name: "Fried", price: 0, isDefault: true, available: true },
      { _key: key("prep", 1), name: "Grilled", price: 0, available: true },
      { _key: key("prep", 2), name: "Blackened", price: 1.50, available: true },
    ],
  },

  // ============================================
  // SIDE CHOICES (Required for Baskets/Combos)
  // ============================================
  {
    _id: "mod-side-choice",
    _type: "modifierGroup",
    name: "Choose a Side",
    slug: { _type: "slug", current: "side-choice" },
    description: "Select one side",
    required: true,
    multiSelect: false,
    displayOrder: 3,
    options: [
      { _key: key("side", 0), name: "French Fries", price: 0, isDefault: true, available: true },
      { _key: key("side", 1), name: "Sweet Potato Fries", price: 1.50, available: true },
      { _key: key("side", 2), name: "Coleslaw", price: 0, available: true },
      { _key: key("side", 3), name: "Hush Puppies", price: 0, available: true },
      { _key: key("side", 4), name: "Red Beans & Rice", price: 0, available: true },
      { _key: key("side", 5), name: "Corn on the Cob", price: 0, available: true },
      { _key: key("side", 6), name: "Fried Okra", price: 0, available: true },
      { _key: key("side", 7), name: "Grits", price: 0, available: true },
      { _key: key("side", 8), name: "Side Salad", price: 1.00, available: true },
    ],
  },

  // ============================================
  // SECOND SIDE (for Combos that include 2 sides)
  // ============================================
  {
    _id: "mod-second-side",
    _type: "modifierGroup",
    name: "Choose Second Side",
    slug: { _type: "slug", current: "second-side" },
    description: "Select your second side",
    required: true,
    multiSelect: false,
    displayOrder: 4,
    options: [
      { _key: key("side2", 0), name: "French Fries", price: 0, isDefault: true, available: true },
      { _key: key("side2", 1), name: "Sweet Potato Fries", price: 1.50, available: true },
      { _key: key("side2", 2), name: "Coleslaw", price: 0, available: true },
      { _key: key("side2", 3), name: "Hush Puppies", price: 0, available: true },
      { _key: key("side2", 4), name: "Red Beans & Rice", price: 0, available: true },
      { _key: key("side2", 5), name: "Corn on the Cob", price: 0, available: true },
      { _key: key("side2", 6), name: "Fried Okra", price: 0, available: true },
      { _key: key("side2", 7), name: "Grits", price: 0, available: true },
      { _key: key("side2", 8), name: "Side Salad", price: 1.00, available: true },
    ],
  },

  // ============================================
  // DRESSING / SAUCE (Optional, multi-select)
  // ============================================
  {
    _id: "mod-dressing",
    _type: "modifierGroup",
    name: "Dressing",
    slug: { _type: "slug", current: "dressing" },
    description: "Choose up to 2 sauces",
    required: false,
    multiSelect: true,
    maxSelections: 2,
    displayOrder: 5,
    options: [
      { _key: key("dress", 0), name: "Tartar Sauce", price: 0, available: true },
      { _key: key("dress", 1), name: "Cocktail Sauce", price: 0, available: true },
      { _key: key("dress", 2), name: "Ranch", price: 0, available: true },
      { _key: key("dress", 3), name: "Remoulade", price: 0, available: true },
      { _key: key("dress", 4), name: "Hot Sauce", price: 0, available: true },
      { _key: key("dress", 5), name: "Honey Mustard", price: 0, available: true },
      { _key: key("dress", 6), name: "Bang Bang Sauce", price: 0.75, available: true },
      { _key: key("dress", 7), name: "Buffalo Sauce", price: 0, available: true },
    ],
  },

  // ============================================
  // SALAD DRESSING
  // ============================================
  {
    _id: "mod-salad-dressing",
    _type: "modifierGroup",
    name: "Salad Dressing",
    slug: { _type: "slug", current: "salad-dressing" },
    description: "Choose your dressing",
    required: true,
    multiSelect: false,
    displayOrder: 3,
    options: [
      { _key: key("salad", 0), name: "Ranch", price: 0, isDefault: true, available: true },
      { _key: key("salad", 1), name: "Honey Mustard", price: 0, available: true },
      { _key: key("salad", 2), name: "Italian", price: 0, available: true },
      { _key: key("salad", 3), name: "Blue Cheese", price: 0, available: true },
      { _key: key("salad", 4), name: "Caesar", price: 0, available: true },
      { _key: key("salad", 5), name: "Remoulade", price: 0, available: true },
      { _key: key("salad", 6), name: "Oil & Vinegar", price: 0, available: true },
    ],
  },

  // ============================================
  // ADD-ONS (Optional extras)
  // ============================================
  {
    _id: "mod-add-ons",
    _type: "modifierGroup",
    name: "Add-Ons",
    slug: { _type: "slug", current: "add-ons" },
    description: "Add extra items",
    required: false,
    multiSelect: true,
    displayOrder: 6,
    options: [
      { _key: key("addon", 0), name: "Extra Shrimp (6)", price: 6.99, available: true },
      { _key: key("addon", 1), name: "Grilled Shrimp (6)", price: 7.99, available: true },
      { _key: key("addon", 2), name: "Extra Catfish", price: 4.99, available: true },
      { _key: key("addon", 3), name: "Extra Whitefish", price: 4.99, available: true },
      { _key: key("addon", 4), name: "Cheese", price: 1.50, available: true },
      { _key: key("addon", 5), name: "Jalapeños", price: 0.75, available: true },
      { _key: key("addon", 6), name: "Bacon", price: 1.99, available: true },
      { _key: key("addon", 7), name: "Avocado", price: 1.99, available: true },
    ],
  },

  // ============================================
  // BREAD CHOICE (for Po'boys)
  // ============================================
  {
    _id: "mod-bread",
    _type: "modifierGroup",
    name: "Bread",
    slug: { _type: "slug", current: "bread" },
    description: "Choose your bread",
    required: true,
    multiSelect: false,
    displayOrder: 2,
    options: [
      { _key: key("bread", 0), name: "French Bread", price: 0, isDefault: true, available: true },
      { _key: key("bread", 1), name: "Wheat Bread", price: 0, available: true },
      { _key: key("bread", 2), name: "Texas Toast", price: 0, available: true },
    ],
  },

  // ============================================
  // TACO QUANTITY
  // ============================================
  {
    _id: "mod-taco-quantity",
    _type: "modifierGroup",
    name: "Number of Tacos",
    slug: { _type: "slug", current: "taco-quantity" },
    description: "How many tacos?",
    required: true,
    multiSelect: false,
    displayOrder: 1,
    options: [
      { _key: key("taco", 0), name: "1 Taco", price: 0, isDefault: true, available: true },
      { _key: key("taco", 1), name: "2 Tacos", price: 4.99, available: true },
      { _key: key("taco", 2), name: "3 Tacos", price: 9.99, available: true },
    ],
  },

  // ============================================
  // BOILED SEASONING
  // ============================================
  {
    _id: "mod-boil-seasoning",
    _type: "modifierGroup",
    name: "Seasoning Level",
    slug: { _type: "slug", current: "seasoning-level" },
    description: "How spicy?",
    required: true,
    multiSelect: false,
    displayOrder: 1,
    options: [
      { _key: key("spice", 0), name: "Mild", price: 0, available: true },
      { _key: key("spice", 1), name: "Medium", price: 0, isDefault: true, available: true },
      { _key: key("spice", 2), name: "Hot", price: 0, available: true },
      { _key: key("spice", 3), name: "Extra Hot", price: 0, available: true },
    ],
  },

  // ============================================
  // BOILED EXTRAS
  // ============================================
  {
    _id: "mod-boil-extras",
    _type: "modifierGroup",
    name: "Add to Your Boil",
    slug: { _type: "slug", current: "boil-extras" },
    description: "Add extras to your boil",
    required: false,
    multiSelect: true,
    displayOrder: 2,
    options: [
      { _key: key("boil", 0), name: "Corn (2 halves)", price: 2.49, available: true },
      { _key: key("boil", 1), name: "Potato (2)", price: 2.49, available: true },
      { _key: key("boil", 2), name: "Sausage (1/2 lb)", price: 5.99, available: true },
      { _key: key("boil", 3), name: "Extra Shrimp (1/2 lb)", price: 9.99, available: true },
      { _key: key("boil", 4), name: "Snow Crab (1 lb)", price: 24.99, available: true },
    ],
  },

  // ============================================
  // DRINK SIZE
  // ============================================
  {
    _id: "mod-drink-size",
    _type: "modifierGroup",
    name: "Size",
    slug: { _type: "slug", current: "drink-size" },
    description: "Choose your size",
    required: true,
    multiSelect: false,
    displayOrder: 1,
    options: [
      { _key: key("drink", 0), name: "Regular", price: 0, isDefault: true, available: true },
      { _key: key("drink", 1), name: "Large", price: 0.50, available: true },
    ],
  },

  // ============================================
  // KIDS MEAL SIDE
  // ============================================
  {
    _id: "mod-kids-side",
    _type: "modifierGroup",
    name: "Kids Side",
    slug: { _type: "slug", current: "kids-side" },
    description: "Choose a side for the kids meal",
    required: true,
    multiSelect: false,
    displayOrder: 2,
    options: [
      { _key: key("kids", 0), name: "French Fries", price: 0, isDefault: true, available: true },
      { _key: key("kids", 1), name: "Hush Puppies", price: 0, available: true },
      { _key: key("kids", 2), name: "Corn on the Cob", price: 0, available: true },
      { _key: key("kids", 3), name: "Applesauce", price: 0, available: true },
    ],
  },

  // ============================================
  // KIDS DRINK
  // ============================================
  {
    _id: "mod-kids-drink",
    _type: "modifierGroup",
    name: "Kids Drink",
    slug: { _type: "slug", current: "kids-drink" },
    description: "Includes a drink",
    required: true,
    multiSelect: false,
    displayOrder: 3,
    options: [
      { _key: key("kdrink", 0), name: "Fountain Drink", price: 0, isDefault: true, available: true },
      { _key: key("kdrink", 1), name: "Juice Box", price: 0, available: true },
      { _key: key("kdrink", 2), name: "Milk", price: 0, available: true },
      { _key: key("kdrink", 3), name: "Chocolate Milk", price: 0.50, available: true },
    ],
  },

  // ============================================
  // SWAMP FRIES/TOTS BASE
  // ============================================
  {
    _id: "mod-swamp-base",
    _type: "modifierGroup",
    name: "Base",
    slug: { _type: "slug", current: "swamp-base" },
    description: "Fries or Tots?",
    required: true,
    multiSelect: false,
    displayOrder: 1,
    options: [
      { _key: key("swamp", 0), name: "Catch Fries", price: 0, isDefault: true, available: true },
      { _key: key("swamp", 1), name: "Tater Tots", price: 0, available: true },
    ],
  },
];

/**
 * CATEGORY TO MODIFIER MAPPING
 * Which modifier groups apply to which menu categories
 */
const CATEGORY_MODIFIERS: Record<string, string[]> = {
  "baskets": ["mod-size-basket", "mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],
  "combos": ["mod-size-basket", "mod-preparation", "mod-side-choice", "mod-second-side", "mod-dressing", "mod-add-ons"],
  "po-boys": ["mod-bread", "mod-preparation", "mod-dressing", "mod-add-ons"],
  "tacos": ["mod-taco-quantity", "mod-preparation", "mod-add-ons"],
  "salads": ["mod-salad-dressing", "mod-add-ons"],
  "boiled": ["mod-boil-seasoning", "mod-boil-extras"],
  "house-favorites": ["mod-preparation", "mod-side-choice", "mod-dressing", "mod-add-ons"],
  "kids-meals": ["mod-kids-side", "mod-kids-drink"],
  "drinks": ["mod-drink-size"],
  "starters": ["mod-dressing"], // Most starters just need dressing
  "sides": [], // Sides typically have no modifiers
  "desserts": [], // Desserts typically have no modifiers
};

async function main() {
  console.log("=== Seed Modifier Groups for The Catch ===\n");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);

  // Check existing modifier groups
  const existing = await client.fetch(`*[_type == "modifierGroup"]._id`);
  console.log(`Found ${existing.length} existing modifier groups\n`);

  // Upsert modifier groups
  for (const group of MODIFIER_GROUPS) {
    const exists = existing.includes(group._id);
    const action = exists ? "UPDATE" : "CREATE";

    console.log(`${action}: ${group.name} (${group._id})`);
    console.log(`  - ${group.options.length} options`);
    console.log(`  - ${group.required ? "Required" : "Optional"}, ${group.multiSelect ? "Multi-select" : "Single-select"}`);

    if (!isDryRun) {
      await client.createOrReplace(group);
    }
  }

  console.log(`\n✅ ${isDryRun ? "Would create/update" : "Created/updated"} ${MODIFIER_GROUPS.length} modifier groups\n`);

  // Show category mapping
  console.log("=== Category to Modifier Mapping ===\n");
  for (const [category, modifierIds] of Object.entries(CATEGORY_MODIFIERS)) {
    const modifierNames = modifierIds.map(id => {
      const group = MODIFIER_GROUPS.find(g => g._id === id);
      return group?.name || id;
    });
    console.log(`${category}: ${modifierNames.length > 0 ? modifierNames.join(", ") : "(none)"}`);
  }

  console.log("\n=== Next Steps ===");
  console.log("1. Run: npx tsx scripts/link-modifiers-to-items.ts --dry-run");
  console.log("2. Review the changes");
  console.log("3. Run: npx tsx scripts/link-modifiers-to-items.ts");
}

main().catch(console.error);
