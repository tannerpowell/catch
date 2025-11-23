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

async function fixFriedOysters() {
  try {
    console.log('Fixing "fried Oysters" to "Fried Oysters"...\n');

    const items = await client.fetch(`
      *[_type == "menuItem" && description match "*fried Oysters*"] {
        _id,
        name,
        description
      }
    `);

    console.log(`Found ${items.length} items to fix\n`);

    const toFix: Array<{id: string, name: string, oldDesc: string, newDesc: string}> = [];

    items.forEach((item: any) => {
      // Replace "fried Oysters" with "Fried Oysters"
      const fixed = item.description.replace(/\bfried Oysters\b/g, 'Fried Oysters');

      if (fixed !== item.description) {
        toFix.push({
          id: item._id,
          name: item.name,
          oldDesc: item.description,
          newDesc: fixed
        });
      }
    });

    console.log(`Fixing ${toFix.length} descriptions:\n`);

    toFix.forEach((fix) => {
      console.log(`${fix.name}:`);
      console.log(`  FROM: "${fix.oldDesc}"`);
      console.log(`  TO:   "${fix.newDesc}"`);
      console.log('');
    });

    if (toFix.length > 0) {
      console.log('\nApplying fixes...\n');

      for (const fix of toFix) {
        await client.patch(fix.id).set({ description: fix.newDesc }).commit();
        console.log(`✓ Fixed: ${fix.name}`);
      }

      console.log(`\n✅ Fixed ${toFix.length} descriptions!`);
    } else {
      console.log('\n✅ No descriptions need fixing!');
    }

  } catch (error) {
    console.error('Error fixing Fried Oysters:', error);
  }
}

fixFriedOysters();
