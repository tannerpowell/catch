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

async function fixCornReferences() {
  console.log('Fixing corn references...\n');

  // 1. Fix the menu item name
  const cornItems = await client.fetch(`
    *[_type == "menuItem" && name match "*corn*" && category->slug.current == "sides"] {
      _id,
      name,
      description
    }
  `);

  console.log(`Found ${cornItems.length} corn items in Sides category:\n`);

  for (const item of cornItems) {
    console.log(`${item.name} (${item._id})`);

    if (item.name.toLowerCase().includes('corn-on-the-cob') || item.name.toLowerCase().includes('corn') && item.name.toLowerCase().includes('potatoes')) {
      const newName = 'Corn & Potatoes';
      await client.patch(item._id).set({ name: newName }).commit();
      console.log(`  ✓ Updated name to: "${newName}"\n`);
    }
  }

  // 2. Fix descriptions that mention "corn-on-the-cob"
  const itemsWithCornDesc = await client.fetch(`
    *[_type == "menuItem" && description match "*corn-on-the-cob*"] {
      _id,
      name,
      description
    }
  `);

  console.log(`\nFound ${itemsWithCornDesc.length} items with "corn-on-the-cob" in description:\n`);

  const toFix: Array<{id: string, name: string, oldDesc: string, newDesc: string}> = [];

  itemsWithCornDesc.forEach((item: any) => {
    // Replace "corn-on-the-cob" with just "corn" in descriptions
    // But keep the quantity format: "with corn (1) and potatoes (2)"
    let newDesc = item.description;

    // Pattern: "with corn-on-the-cob (1) and potatoes (2)" → "with corn (1) and potatoes (2)"
    newDesc = newDesc.replace(/\bcorn-on-the-cob\b/gi, 'corn');

    if (newDesc !== item.description) {
      toFix.push({
        id: item._id,
        name: item.name,
        oldDesc: item.description,
        newDesc: newDesc
      });
    }
  });

  console.log(`Changes to make:\n`);
  toFix.forEach((fix, idx) => {
    console.log(`${idx + 1}. ${fix.name}:`);
    console.log(`   FROM: "${fix.oldDesc}"`);
    console.log(`   TO:   "${fix.newDesc}"`);
    console.log('');
  });

  if (toFix.length > 0) {
    console.log('Applying fixes...\n');

    for (const fix of toFix) {
      await client.patch(fix.id).set({ description: fix.newDesc }).commit();
      console.log(`✓ Fixed: ${fix.name}`);
    }

    console.log(`\n✅ Updated ${toFix.length} descriptions!`);
  } else {
    console.log('✅ No descriptions need fixing!');
  }
}

fixCornReferences();
