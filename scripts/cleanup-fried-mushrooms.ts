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

async function cleanupFriedMushrooms() {
  const items = await client.fetch(`
    *[_type == "menuItem" && name match "*Fried Mushrooms*"] {
      _id,
      name,
      slug,
      image,
      category->{title, slug}
    }
  `);

  console.log(`Found ${items.length} Fried Mushrooms items\n`);

  // Keep the one with an image
  const keepItem = items.find((item: any) => item._id === 'item-fried-mushrooms');
  const deleteItems = items.filter((item: any) => item._id !== 'item-fried-mushrooms');

  console.log('KEEPING:');
  console.log(`  ${keepItem._id} - Has image: ${!!keepItem.image}\n`);

  console.log(`DELETING ${deleteItems.length} duplicates:`);
  deleteItems.forEach((item: any) => {
    console.log(`  ${item._id}`);
  });

  console.log('\nDeleting duplicates...\n');

  for (const item of deleteItems) {
    await client.delete(item._id);
    console.log(`✓ Deleted: ${item._id}`);
  }

  console.log(`\n✅ Cleanup complete! Kept 1, deleted ${deleteItems.length} duplicates.`);
}

cleanupFriedMushrooms();
