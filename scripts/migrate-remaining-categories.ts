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

// Map old categories to new ones
const MIGRATIONS = {
  'menuCategory-dips': 'cat-sides',
  'menuCategory-kids-meals': 'cat-kids-menu',
  'menuCategory-po-boys-taco-s-sandwiches': 'cat-sandwiches-more',
  'menuCategory-po-boys-tacos-sandwiches': 'cat-sandwiches-more',
  'menuCategory-sauces': 'cat-sides',
};

async function migrateCategories() {
  try {
    console.log('Starting category migration...\n');

    for (const [oldCatId, newCatId] of Object.entries(MIGRATIONS)) {
      console.log(`\nMigrating ${oldCatId} → ${newCatId}...`);

      // Find all menu items referencing the old category
      const referencingItems = await client.fetch(
        `*[_type == "menuItem" && references($catId)]._id`,
        { catId: oldCatId }
      );

      if (referencingItems.length === 0) {
        console.log(`  No items found referencing ${oldCatId}`);
        continue;
      }

      console.log(`  Found ${referencingItems.length} items to migrate`);

      // Migrate each item
      for (const itemId of referencingItems) {
        await client
          .patch(itemId)
          .set({ category: { _type: 'reference', _ref: newCatId } })
          .commit();
      }

      console.log(`  ✓ Migrated ${referencingItems.length} items`);

      // Now try to delete the old category
      try {
        await client.delete(oldCatId);
        console.log(`  ✓ Deleted ${oldCatId}`);
      } catch (err: any) {
        console.log(`  ⚠️  Could not delete ${oldCatId}: ${err.message}`);
      }
    }

    console.log('\n✅ Migration complete!');

    // Show final categories
    const finalCategories = await client.fetch(
      `*[_type == "menuCategory"] | order(position asc) {title, "slug": slug.current, position}`
    );

    console.log('\nFinal categories:');
    finalCategories.forEach((cat: any) => {
      if (cat.position !== null && cat.position !== undefined) {
        console.log(`  ${cat.position} | ${cat.title}`);
      } else {
        console.log(`  NO POS | ${cat.title}`);
      }
    });

  } catch (error) {
    console.error('Error migrating categories:', error);
  }
}

migrateCategories();
