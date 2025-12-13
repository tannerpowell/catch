/**
 * Conroe Menu Sync Script
 * 
 * Syncs menu items from JSON to Sanity for the Conroe location.
 * - JSON is source of truth for which items exist and their prices
 * - Sanity descriptions and images are preserved
 * 
 * Usage:
 *   npx tsx scripts/sync-conroe-menu.ts --dry-run   # Preview changes
 *   npx tsx scripts/sync-conroe-menu.ts             # Apply changes
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
});

const CONROE_LOCATION_ID = 'loc-conroe';

// ============================================================================
// MENU DATA FROM JSON
// ============================================================================

const menuData = {
    "restaurant": "The Catch Seafood",
    "categories": [
        {
            "name": "Popular",
            "items": [
                { "name": "Cajun Special", "price": 18.00 },
                { "name": "Catfish", "price": 14.00 },
                { "name": "Bang Bang Shrimp", "price": 13.00 },
                { "name": "Bourbon Chicken Pasta", "price": 17.00 },
                { "name": "Shrimp", "price": 14.00 },
                { "name": "Crispy Gator Bites", "price": 16.00 }
            ]
        },
        {
            "name": "Starters",
            "items": [
                { "name": "Gumbo", "price": 7.00, "description": "Seafood gumbo, Shrimp, Crawfish & sausage" },
                { "name": "Shrimp Étouffée", "price": 7.00 },
                { "name": "Boudin Balls (6)", "price": 8.00 },
                { "name": "Fried Pickles", "price": 8.00 },
                { "name": "Fried Green Tomatoes", "price": 10.00 },
                { "name": "Bang Bang Shrimp", "price": 13.00 },
                { "name": "Fried Mushrooms", "price": 8.00 },
                { "name": "Crispy Gator Bites", "price": 16.00 },
                { "name": "Swamp Fries", "price": 10.00 },
                { "name": "Boudin Egg Rolls (3)", "price": 8.00 }
            ]
        },
        {
            "name": "Baskets",
            "items": [
                { "name": "Catfish Basket", "price": 11.00 },
                { "name": "Catfish Nugget Basket", "price": 10.00 },
                { "name": "Whitefish Basket", "price": 11.00 },
                { "name": "Jumbo Shrimp Basket", "price": 11.00, "description": "5, 8 or 12 Jumbo Shrimp with your choice of side item and Hush Puppies (2)" },
                { "name": "Popcorn Shrimp Basket", "price": 11.00 },
                { "name": "Chicken Tender Basket", "price": 11.00 },
                { "name": "Crawfish Tails Basket", "price": 18.00 },
                { "name": "Gator Basket", "price": 19.00 }
            ]
        },
        {
            "name": "Combos",
            "items": [
                { "name": "Jumbo Shrimp (8) & Catfish (2) Combo", "price": 18.00 },
                { "name": "Jumbo Shrimp (6) & Catfish (1) Combo", "price": 15.00 },
                { "name": "Catfish Nuggets & Shrimp Combo", "price": 15.00 },
                { "name": "Captain's Combo", "price": 24.00, "description": "Catfish (2), Jumbo Shrimp (8), Boudin Balls (4) with side item of choice and Hush Puppies (3)" },
                { "name": "Buffalo Ranch Catfish Nuggets & Shrimp Combo", "price": 15.00 },
                { "name": "Catfish (1) & Crawfish Tails Combo", "price": 18.00 },
                { "name": "Catfish (2) & Gator Combo", "price": 20.00 },
                { "name": "Catfish (1) & Chicken Tenders (3) Combo", "price": 14.00 },
                { "name": "Jumbo Shrimp (6), Catfish (1) & Chicken Tenders (2) Combo", "price": 18.00 },
                { "name": "Catch 22 Combo", "price": 30.00, "description": "Catfish (2), Whitefish (1), Jumbo Shrimp (8) and Fried Oysters (2) with side item and Hush Puppies (4)" },
                { "name": "Admiral's Platter", "price": 37.00, "description": "Catfish (2), Whitefish (1), Jumbo Shrimp (8), Fried Oysters (2) and Crawfish Tails with side item and Hush Puppies (4)" }
            ]
        },
        {
            "name": "House Favorites",
            "items": [
                { "name": "Cajun Special", "price": 18.00 },
                { "name": "French Quarter Plate", "price": 19.00 },
                { "name": "The Big Easy", "price": 19.00 },
                { "name": "Bourbon Chicken Pasta", "price": 17.00 },
                { "name": "Alfredo Pasta", "price": 16.00 },
                { "name": "Creamy Cajun Pasta", "price": 18.00 },
                { "name": "Chicken & Beignets", "price": 15.00 },
                { "name": "Chicken & Waffles", "price": 15.00 },
                { "name": "Shrimp Étouffée Quesadilla", "price": 15.00 },
                { "name": "Gumbo Quesadilla", "price": 15.00 }
            ]
        },
        {
            "name": "Boiled Favorites",
            "items": [
                { "name": "Boiled Shrimp", "price": 11.00 },
                { "name": "Snow Crab", "price": 18.00 },
                { "name": "The Catch Boil", "price": 32.00 },
                { "name": "Add (1) Boiled Egg", "price": 2.00 },
                { "name": "Fried Snow Crab", "price": 20.00 }
            ]
        },
        {
            "name": "Sandwiches & More",
            "items": [
                { "name": "Catfish Po'Boy", "price": 14.00 },
                { "name": "Shrimp Po'Boy", "price": 14.00 },
                { "name": "Crawfish Tails Po'Boy", "price": 17.00 },
                { "name": "Gator Po'Boy", "price": 18.00 },
                { "name": "Fried Oysters Po'Boy", "price": 19.00 },
                { "name": "BYO Burger", "price": 12.00 },
                { "name": "Chicken Tender Sandwich", "price": 12.00 },
                { "name": "Whitefish Sandwich", "price": 12.00 },
                { "name": "Half & Half Po'Boy", "price": 18.00, "description": "Shrimp & Oyster Po'Boy" }
            ]
        },
        {
            "name": "Salads",
            "items": [
                { "name": "Caesar Salad", "price": 13.00 },
                { "name": "House Salad", "price": 13.00 },
                { "name": "Side Salad", "price": 6.00 }
            ]
        },
        {
            "name": "Desserts",
            "items": [
                { "name": "Banana Pudding", "price": 6.00 },
                { "name": "Key Lime Pie", "price": 6.00 },
                { "name": "Warm Beignets (4)", "price": 8.00 },
                { "name": "Chocolate Chip Cookie", "price": 2.59 },
                { "name": "Peanut Butter Cookie", "price": 2.59 }
            ]
        },
        {
            "name": "Kids Menu",
            "items": [
                { "name": "Kids Catfish Nuggets", "price": 8.00 },
                { "name": "Kids Popcorn Shrimp", "price": 8.00 },
                { "name": "Kids Chicken Tenders", "price": 8.00 }
            ]
        },
        {
            "name": "Family Packs",
            "items": [
                { "name": "Catfish (10)", "price": 45.00 },
                { "name": "Whitefish (10)", "price": 45.00 },
                { "name": "Chicken Tenders (16)", "price": 40.00 },
                { "name": "Jumbo Shrimp (36)", "price": 45.00 },
                { "name": "Catfish (8) & Jumbo Shrimp (20)", "price": 55.00 },
                { "name": "Catfish (8), Jumbo Shrimp (20) & Chicken Tenders (8)", "price": 65.00 }
            ]
        },
        {
            "name": "À La Carte",
            "items": [
                { "name": "Add (1) Catfish Fillet", "price": 6.00 },
                { "name": "Add (1) Whitefish Fillet", "price": 6.00 },
                { "name": "Add (4) Jumbo Shrimp", "price": 7.00 },
                { "name": "Add (2.5 oz) Popcorn Shrimp", "price": 5.00 },
                { "name": "Add (3) Tenders", "price": 6.00 },
                { "name": "Add (2.5 oz) Crawfish Tails", "price": 6.00 },
                { "name": "Add (4) Fried Oysters", "price": 7.00 },
                { "name": "Add (1) Grilled Sausage", "price": 6.00 },
                { "name": "Add (1) Garlic Bread", "price": 1.00 }
            ]
        },
        {
            "name": "Condiments",
            "items": [
                { "name": "Dipping Sauce", "price": 0.01 },
                { "name": "Lemons", "price": 0.01 },
                { "name": "Side Butter", "price": 1.25 },
                { "name": "Creamy Cajun Sauce (8 oz)", "price": 3.74 },
                { "name": "Étouffée Smother", "price": 3.74 }
            ]
        },
        {
            "name": "Off-Menu Combos",
            "items": [
                { "name": "Catfish (2) & Fried Oysters (4)", "price": 16.99 },
                { "name": "Jumbo Shrimp (4) & Fried Oysters (4)", "price": 16.99 },
                { "name": "Jumbo Shrimp (4) & Chicken Tenders (4)", "price": 13.49 },
                { "name": "Jumbo Shrimp (4) & Whitefish (2)", "price": 16.99 }
            ]
        },
        {
            "name": "Sides",
            "items": [
                { "name": "Catch Fries", "price": 4.00 },
                { "name": "Red Beans & Rice", "price": 4.00 },
                { "name": "Dirty Rice", "price": 4.00 },
                { "name": "Fried Okra", "price": 4.00 },
                { "name": "Onion Rings", "price": 5.00 },
                { "name": "Coleslaw", "price": 4.00 },
                { "name": "Corn & Potatoes", "price": 4.00 },
                { "name": "Green Beans", "price": 4.00 },
                { "name": "Hush Puppies", "price": 3.00 },
                { "name": "White Rice", "price": 3.00 }
            ]
        },
        {
            "name": "Drinks",
            "items": [
                { "name": "Fountain Drink", "price": 2.00 },
                { "name": "Bottled Water", "price": 2.99 }
            ]
        }
    ]
};

// ============================================================================
// HELPERS
// ============================================================================

interface JsonItem {
    name: string;
    price: number;
    description?: string;
    category: string;
}

interface SanityItem {
    _id: string;
    name: string;
    description?: string;
    image?: any;
    basePrice?: number;
    category?: { _ref: string };
    locationOverrides?: Array<{
        _key: string;
        _type: string;
        available: boolean;
        location: { _ref: string };
        price: number;
    }>;
}

function normalizeForMatching(name: string | null | undefined): string {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/['']/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/é/g, 'e')
        .replace(/[^\w\s\-&()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[()]/g, '')
        .replace(/[&]/g, 'and')
        .replace(/[éè]/g, 'e')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function generateItemId(name: string): string {
    return 'item-' + generateSlug(name);
}

function generateCategoryId(name: string): string {
    return 'cat-' + generateSlug(name);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              CONROE MENU SYNC                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be applied\n');
    }

    // Build flat list of JSON items with category
    const jsonItems: JsonItem[] = [];
    for (const category of menuData.categories) {
        for (const item of category.items) {
            // Skip duplicates (Popular section has items from other categories)
            if (category.name === 'Popular') continue;

            jsonItems.push({
                name: item.name,
                price: item.price,
                description: item.description,
                category: category.name,
            });
        }
    }

    console.log(`📋 JSON has ${jsonItems.length} unique items\n`);

    // Create normalized lookup
    const jsonByNormalized = new Map<string, JsonItem>();
    for (const item of jsonItems) {
        jsonByNormalized.set(normalizeForMatching(item.name), item);
    }

    // Fetch existing Sanity items with Conroe overrides
    console.log('Fetching Sanity items with Conroe overrides...\n');

    const sanityItems: SanityItem[] = await client.fetch(`
    *[_type == "menuItem" && count(locationOverrides[location._ref == $locationId]) > 0] {
      _id,
      name,
      description,
      image,
      basePrice,
      category,
      locationOverrides
    }
  `, { locationId: CONROE_LOCATION_ID });

    console.log(`📦 Sanity has ${sanityItems.length} items with Conroe overrides\n`);

    // Fetch all Sanity items (for matching items that might exist without Conroe override)
    const allSanityItems: SanityItem[] = await client.fetch(`
    *[_type == "menuItem"] {
      _id,
      name,
      description,
      image,
      basePrice,
      category,
      locationOverrides
    }
  `);

    // Create lookups
    const sanityByNormalized = new Map<string, SanityItem>();
    for (const item of allSanityItems) {
        if (item.name) {
            const normalized = normalizeForMatching(item.name);
            if (normalized) {
                sanityByNormalized.set(normalized, item);
            }
        }
    }

    // Fetch existing categories
    const existingCategories = await client.fetch(`
    *[_type == "menuCategory"] { _id, name }
  `);
    const categoryMap = new Map<string, string>();
    for (const cat of existingCategories) {
        categoryMap.set(normalizeForMatching(cat.name), cat._id);
    }

    // Stats
    let updated = 0;
    let created = 0;
    let removed = 0;
    let unchanged = 0;
    let categoriesCreated = 0;

    // Track which Sanity items we've matched
    const matchedSanityIds = new Set<string>();

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('PROCESSING JSON ITEMS:\n');

    // Process each JSON item
    for (const jsonItem of jsonItems) {
        const normalized = normalizeForMatching(jsonItem.name);
        const existing = sanityByNormalized.get(normalized);

        // Ensure category exists
        let categoryId = categoryMap.get(normalizeForMatching(jsonItem.category));
        if (!categoryId) {
            categoryId = generateCategoryId(jsonItem.category);
            console.log(`  📁 CREATE CATEGORY: ${jsonItem.category} (${categoryId})`);
            categoriesCreated++;

            if (!dryRun) {
                await client.createIfNotExists({
                    _id: categoryId,
                    _type: 'menuCategory',
                    name: jsonItem.category,
                    slug: { _type: 'slug', current: generateSlug(jsonItem.category) },
                });
            }
            categoryMap.set(normalizeForMatching(jsonItem.category), categoryId);
        }

        if (existing) {
            // Item exists in Sanity
            matchedSanityIds.add(existing._id);

            const conroeOverride = existing.locationOverrides?.find(
                (o) => o.location._ref === CONROE_LOCATION_ID
            );

            const needsPriceUpdate = conroeOverride?.price !== jsonItem.price;
            const needsDescriptionUpdate = jsonItem.description && existing.description !== jsonItem.description;

            if (needsPriceUpdate || needsDescriptionUpdate) {
                console.log(`  ↻ UPDATE: "${jsonItem.name}"`);
                if (needsPriceUpdate) {
                    console.log(`      price: ${conroeOverride?.price ?? 'none'} → ${jsonItem.price}`);
                }
                if (needsDescriptionUpdate) {
                    console.log(`      description: updating (preserving existing if JSON has none)`);
                }
                updated++;

                if (!dryRun) {
                    const patch = client.patch(existing._id);

                    // Update or add Conroe override
                    if (conroeOverride) {
                        // Update existing override price
                        const updatedOverrides = existing.locationOverrides!.map((o) =>
                            o.location._ref === CONROE_LOCATION_ID
                                ? { ...o, price: jsonItem.price }
                                : o
                        );
                        patch.set({ locationOverrides: updatedOverrides });
                    } else {
                        // Add new Conroe override
                        patch.setIfMissing({ locationOverrides: [] });
                        patch.append('locationOverrides', [
                            {
                                _key: `conroe-${Date.now()}`,
                                _type: 'locationOverride',
                                available: true,
                                location: { _type: 'reference', _ref: CONROE_LOCATION_ID },
                                price: jsonItem.price,
                            },
                        ]);
                    }

                    // Update description only if JSON has one
                    if (jsonItem.description) {
                        patch.set({ description: jsonItem.description });
                    }

                    await patch.commit();
                }
            } else {
                unchanged++;
            }
        } else {
            // New item - create it
            console.log(`  ✚ CREATE: "${jsonItem.name}" ($${jsonItem.price})`);
            created++;

            if (!dryRun) {
                const newId = generateItemId(jsonItem.name);
                await client.createIfNotExists({
                    _id: newId,
                    _type: 'menuItem',
                    name: jsonItem.name,
                    slug: { _type: 'slug', current: generateSlug(jsonItem.name) },
                    description: jsonItem.description || null,
                    basePrice: jsonItem.price,
                    category: { _type: 'reference', _ref: categoryId },
                    locationOverrides: [
                        {
                            _key: `conroe-${Date.now()}`,
                            _type: 'locationOverride',
                            available: true,
                            location: { _type: 'reference', _ref: CONROE_LOCATION_ID },
                            price: jsonItem.price,
                        },
                    ],
                });
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('REMOVING CONROE OVERRIDES FOR ITEMS NOT IN JSON:\n');

    // Find Sanity items with Conroe overrides that aren't in JSON
    for (const sanityItem of sanityItems) {
        if (!sanityItem.name) {
            console.log(`  ⚠️  SKIPPING: Item with no name (_id: ${sanityItem._id})`);
            continue;
        }
        if (!matchedSanityIds.has(sanityItem._id)) {
            console.log(`  ✖ REMOVE CONROE OVERRIDE: "${sanityItem.name}"`);
            removed++;

            if (!dryRun) {
                const updatedOverrides = sanityItem.locationOverrides?.filter(
                    (o) => o.location._ref !== CONROE_LOCATION_ID
                ) || [];

                await client.patch(sanityItem._id).set({ locationOverrides: updatedOverrides }).commit();
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY:');
    console.log(`  Categories created:        ${categoriesCreated}`);
    console.log(`  Items created:             ${created}`);
    console.log(`  Items updated:             ${updated}`);
    console.log(`  Items unchanged:           ${unchanged}`);
    console.log(`  Conroe overrides removed:  ${removed}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (dryRun) {
        console.log('⚠️  Run without --dry-run to apply these changes\n');
    } else {
        console.log('✅ Sync complete!\n');
    }
}

main().catch(console.error);
