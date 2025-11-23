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

// Correct categories with their expected titles
const CORRECT_CATEGORIES = {
  'popular': 'Popular',
  'starters': 'Starters',
  'baskets': 'Baskets',
  'combos': 'Combos',
  'house-favorites': 'House Favorites',
  'boiled-favorites': 'Boiled Favorites',
  'sandwiches-more': 'Sandwiches & More',
  'salads': 'Salads',
  'desserts': 'Desserts',
  'kids-menu': 'Kids Menu',
  'family-packs': 'Family Packs',
  'a-la-carte': 'À la carte',
  'condiments': 'Condiments',
  'off-menu-combos': 'Off-Menu Combos',
  'sides': 'Sides',
  'drinks': 'Drinks',
};

async function cleanupCategories() {
  try {
    // Get all categories
    const categories = await client.fetch(
      `*[_type == "menuCategory"] | order(position asc) {_id, title, "slug": slug.current, position}`
    );

    console.log('\nFound categories:');
    categories.forEach((cat: any) => {
      console.log(`  ${cat.position ?? 'NO POS'} | ${cat.slug} | "${cat.title}"`);
    });

    // Find duplicates and incorrect titles
    const seenSlugs = new Set();
    const toDelete: string[] = [];
    const toUpdate: Array<{id: string, title: string}> = [];

    for (const cat of categories) {
      const expectedTitle = CORRECT_CATEGORIES[cat.slug as keyof typeof CORRECT_CATEGORIES];

      if (!expectedTitle) {
        // Unknown category - mark for deletion
        console.log(`\n❌ Unknown category to DELETE: "${cat.title}" (${cat.slug})`);
        toDelete.push(cat._id);
      } else if (seenSlugs.has(cat.slug)) {
        // Duplicate - mark for deletion
        console.log(`\n❌ Duplicate category to DELETE: "${cat.title}" (${cat.slug})`);
        toDelete.push(cat._id);
      } else if (cat.title !== expectedTitle) {
        // Wrong title - mark for update
        console.log(`\n🔧 Update: "${cat.title}" → "${expectedTitle}"`);
        toUpdate.push({ id: cat._id, title: expectedTitle });
        seenSlugs.add(cat.slug);
      } else {
        // Correct
        seenSlugs.add(cat.slug);
      }
    }

    // Perform updates
    if (toUpdate.length > 0) {
      console.log(`\n\nUpdating ${toUpdate.length} categories...`);
      for (const {id, title} of toUpdate) {
        await client.patch(id).set({ title }).commit();
        console.log(`  ✓ Updated to "${title}"`);
      }
    }

    // Perform deletions (with reference migration)
    if (toDelete.length > 0) {
      console.log(`\n\nDeleting ${toDelete.length} duplicate/unknown categories...`);

      for (const id of toDelete) {
        // Find the category to delete
        const catToDelete = categories.find((c: any) => c._id === id);
        if (!catToDelete) continue;

        // Find the correct category with same slug
        const correctCat = categories.find((c: any) =>
          c.slug === catToDelete.slug &&
          c._id !== id &&
          !toDelete.includes(c._id)
        );

        if (correctCat) {
          // Migrate references before deleting
          console.log(`  Migrating references from ${id} to ${correctCat._id}...`);

          // Find all menu items referencing this category
          const referencingItems = await client.fetch(
            `*[_type == "menuItem" && references($catId)]._id`,
            { catId: id }
          );

          if (referencingItems.length > 0) {
            console.log(`    Found ${referencingItems.length} items to update`);
            for (const itemId of referencingItems) {
              await client
                .patch(itemId)
                .set({ category: { _type: 'reference', _ref: correctCat._id } })
                .commit();
            }
            console.log(`    ✓ Migrated ${referencingItems.length} references`);
          }
        }

        // Now delete the category
        try {
          await client.delete(id);
          console.log(`  ✓ Deleted ${id}`);
        } catch (err: any) {
          console.log(`  ⚠️  Could not delete ${id}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Category cleanup complete!');

    // Show final list
    const finalCategories = await client.fetch(
      `*[_type == "menuCategory"] | order(position asc) {title, "slug": slug.current, position}`
    );
    console.log('\nFinal categories:');
    finalCategories.forEach((cat: any) => {
      console.log(`  ${cat.position ?? 'NO POS'} | ${cat.title}`);
    });

  } catch (error) {
    console.error('Error cleaning up categories:', error);
  }
}

cleanupCategories();
