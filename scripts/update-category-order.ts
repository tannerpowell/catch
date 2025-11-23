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

// New order as specified
const categoryOrder = [
  'popular',
  'starters',
  'baskets',
  'combos',
  'house-favorites',
  'boiled-favorites',
  'off-menu-combos',
  'family-packs',
  // Hard return / visual break here (position 8-9 gap)
  'sandwiches-more',
  'salads',
  'a-la-carte',
  'condiments',
  'sides',
  'drinks',
  'kids-menu',
  'desserts',
];

async function updateCategoryOrder() {
  console.log('Updating menu category order...\n');

  const categories = await client.fetch(`
    *[_type == "menuCategory"] {
      _id,
      title,
      "slug": slug.current,
      position
    }
  `);

  console.log(`Found ${categories.length} categories\n`);

  let updated = 0;
  let notFound: string[] = [];

  for (let i = 0; i < categoryOrder.length; i++) {
    const slug = categoryOrder[i];
    const category = categories.find((c: any) => c.slug === slug);

    if (!category) {
      notFound.push(slug);
      console.log(`⚠️  Category not found: ${slug}`);
      continue;
    }

    // Position starts at 0
    // Add gap of 10 after Family Packs (position 7)
    const newPosition = i < 8 ? i : i + 10;

    if (category.position !== newPosition) {
      await client
        .patch(category._id)
        .set({ position: newPosition })
        .commit();

      console.log(`✅ ${category.title}: position ${category.position || 'null'} → ${newPosition}`);
      updated++;
    } else {
      console.log(`  ${category.title}: already at position ${newPosition}`);
    }
  }

  console.log(`\n📊 Update Summary:`);
  console.log(`  ✅ Updated: ${updated} categories`);
  console.log(`  ⚠️  Not found: ${notFound.length} categories`);

  if (notFound.length > 0) {
    console.log(`\n  Missing categories: ${notFound.join(', ')}`);
  }

  // Show final order
  console.log('\n\n📋 Final Category Order:\n');
  const finalCategories = await client.fetch(`
    *[_type == "menuCategory"] | order(position asc) {
      title,
      "slug": slug.current,
      position
    }
  `);

  finalCategories.forEach((cat: any, idx: number) => {
    console.log(`${cat.position}\t${cat.title} (${cat.slug})`);
  });

  console.log('\n✅ Category order update complete!');
}

updateCategoryOrder();
