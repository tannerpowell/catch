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

function fixDescription(desc: string): string {
  if (!desc) return desc;

  let fixed = desc;

  // Remove leading comma from ", corn-on-the-cob"
  fixed = fixed.replace(/^,\s*/, '');

  // Fix incomplete protein lists: "Catfish (8) & 12 jumbo shrimp" → "Catfish (8) & Jumbo Shrimp (12)"
  fixed = fixed.replace(/([A-Z][a-z]+)\s*\((\d+)\)\s*(&|,)\s*(\d+)\s+(jumbo shrimp|Jumbo Shrimp)/gi,
    (match, protein1, num1, separator, num2, protein2) => {
      return `${protein1} (${num1}) ${separator} Jumbo Shrimp (${num2})`;
    }
  );

  // Fix "Catfish (8) & 8 tenders" → "Catfish (8) & Chicken Tenders (8)"
  fixed = fixed.replace(/([A-Z][a-z]+)\s*\((\d+)\)\s*(&|,)\s*(\d+)\s+(tenders?)/gi,
    (match, protein1, num1, separator, num2, tenders) => {
      return `${protein1} (${num1}) ${separator} Chicken Tenders (${num2})`;
    }
  );

  // Lowercase "Queso" (not a proper noun when referring to cheese sauce)
  fixed = fixed.replace(/\bQueso\b/g, 'queso');

  // Remove trailing period from single-sentence descriptions
  // (Only if there's exactly one sentence - no other periods in the middle)
  const periodCount = (fixed.match(/\./g) || []).length;
  if (periodCount === 1 && fixed.endsWith('.')) {
    fixed = fixed.slice(0, -1);
  }

  return fixed;
}

function fixName(name: string): string {
  if (!name) return name;

  let fixed = name;

  // Remove leading comma
  fixed = fixed.replace(/^,\s*/, '');

  // "Side salad" → "Side Salad" (when it's a menu item name)
  fixed = fixed.replace(/\bSide salad\b/g, 'Side Salad');

  return fixed;
}

async function fixAllDescriptions() {
  try {
    console.log('Fetching all menu items...\n');

    const items = await client.fetch(`
      *[_type == "menuItem"] {
        _id,
        name,
        description
      }
    `);

    console.log(`Found ${items.length} items\n`);

    const toFix: Array<{id: string, itemName: string, field: 'name' | 'description', oldValue: string, newValue: string}> = [];

    items.forEach((item: any) => {
      // Check name
      if (item.name) {
        const fixedName = fixName(item.name);
        if (fixedName !== item.name) {
          toFix.push({
            id: item._id,
            itemName: item.name,
            field: 'name',
            oldValue: item.name,
            newValue: fixedName
          });
        }
      }

      // Check description
      if (item.description) {
        const fixedDesc = fixDescription(item.description);
        if (fixedDesc !== item.description) {
          toFix.push({
            id: item._id,
            itemName: item.name,
            field: 'description',
            oldValue: item.description,
            newValue: fixedDesc
          });
        }
      }
    });

    console.log(`Found ${toFix.length} fields to fix:\n`);

    // Show all
    toFix.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.itemName} [${fix.field}]:`);
      console.log(`   FROM: "${fix.oldValue}"`);
      console.log(`   TO:   "${fix.newValue}"`);
      console.log('');
    });

    if (toFix.length > 0) {
      console.log('\nApplying fixes...\n');

      for (const fix of toFix) {
        await client.patch(fix.id).set({ [fix.field]: fix.newValue }).commit();
        console.log(`✓ Fixed: ${fix.itemName} [${fix.field}]`);
      }

      console.log(`\n✅ Fixed ${toFix.length} fields!`);
    } else {
      console.log('\n✅ No fields need fixing!');
    }

  } catch (error) {
    console.error('Error fixing descriptions:', error);
  }
}

fixAllDescriptions();
