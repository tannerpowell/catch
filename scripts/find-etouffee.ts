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

async function findEtouffee() {
  try {
    console.log('Searching for all Etouffee variants in Sanity...\n');

    // Search in menu item names and descriptions
    const items = await client.fetch(`
      *[_type == "menuItem" && (
        name match "*touff*" ||
        name match "*Touff*" ||
        description match "*touff*" ||
        description match "*Touff*"
      )] {
        _id,
        name,
        description,
        "slug": slug.current
      }
    `);

    console.log(`Found ${items.length} items with 'touff' in name or description:\n`);

    items.forEach((item: any) => {
      console.log(`ID: ${item._id}`);
      console.log(`Name: ${item.name}`);
      if (item.description) {
        console.log(`Description: ${item.description}`);
      }
      console.log(`Slug: ${item.slug}`);
      console.log('---');
    });

    // Now update all items that need fixing
    console.log('\n\nItems to fix:');
    const toFix: Array<{id: string, field: string, oldValue: string, newValue: string}> = [];

    items.forEach((item: any) => {
      // Check name
      if (item.name && /[Ee]touffee/.test(item.name)) {
        const fixed = item.name.replace(/[Ee]touffee/g, 'Étouffée');
        if (fixed !== item.name) {
          toFix.push({
            id: item._id,
            field: 'name',
            oldValue: item.name,
            newValue: fixed
          });
        }
      }

      // Check description
      if (item.description && /[Ee]touffee/.test(item.description)) {
        const fixed = item.description.replace(/[Ee]touffee/g, 'étouffée');
        if (fixed !== item.description) {
          toFix.push({
            id: item._id,
            field: 'description',
            oldValue: item.description,
            newValue: fixed
          });
        }
      }
    });

    console.log(`Found ${toFix.length} fields to fix:\n`);
    toFix.forEach((fix) => {
      console.log(`${fix.id} - ${fix.field}:`);
      console.log(`  FROM: "${fix.oldValue}"`);
      console.log(`  TO:   "${fix.newValue}"`);
      console.log('');
    });

    if (toFix.length > 0) {
      console.log('\nApplying fixes...\n');

      for (const fix of toFix) {
        await client.patch(fix.id).set({ [fix.field]: fix.newValue }).commit();
        console.log(`✓ Fixed ${fix.id} - ${fix.field}`);
      }

      console.log(`\n✅ Fixed ${toFix.length} items!`);
    } else {
      console.log('\n✅ No items need fixing!');
    }

  } catch (error) {
    console.error('Error finding Etouffee:', error);
  }
}

findEtouffee();
