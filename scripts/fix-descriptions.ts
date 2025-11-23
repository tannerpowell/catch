import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2025-11-22',
  useCdn: false,
});

function fixDescription(desc: string): string {
  if (!desc) return desc;

  let fixed = desc;

  // Fix Étouffée capitalization (capital É at start of word only)
  fixed = fixed.replace(/\bétouffée\b/gi, 'étouffée');
  fixed = fixed.replace(/\bÉtouffée\b/g, 'Étouffée'); // Keep if already correct
  fixed = fixed.replace(/([.!?]\s+)étouffée/g, '$1Étouffée'); // Capital after sentence
  fixed = fixed.replace(/^étouffée/g, 'Étouffée'); // Capital at start

  // Remove spaces in fractions: "1/4 lb" → "1/4lb"
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2');

  // Lowercase common food terms
  fixed = fixed.replace(/\b(Side Item|Hush Puppies|Monterrey Jack Cheese|Jumbo Shrimp|Diced Tomato|Green Onion|Bacon Bits|Sour Cream)\b/g, (match) => {
    return match.toLowerCase();
  });

  // Fix cooking method parentheses - remove caps and extra formatting
  // "(Fried, Grilled or Blackened)" → "fried, grilled or blackened"
  fixed = fixed.replace(/\((Fried|Grilled|Blackened|Boiled)(,?\s+(Fried|Grilled|Blackened|Boiled))*\)/gi, (match) => {
    return match.toLowerCase();
  });

  // Move quantities: "2 Catfish" → "Catfish (2)"
  // But need to be careful about context
  fixed = fixed.replace(/\b(\d+)\s+(Catfish|Whitefish|Jumbo Shrimp|Oysters?|Tenders?|Chicken)\b/gi, (match, num, item) => {
    return `${item.toLowerCase()} (${num})`;
  });

  // Fix "and" in cooking methods: "Fried or Blackened" should stay lowercase
  fixed = fixed.replace(/,\s*served with/i, ', served with');

  return fixed;
}

async function fixAllDescriptions() {
  try {
    console.log('Fetching all menu items with descriptions...\n');

    const items = await client.fetch(`
      *[_type == "menuItem" && description != null] {
        _id,
        name,
        description
      }
    `);

    console.log(`Found ${items.length} items with descriptions\n`);

    const toFix: Array<{id: string, name: string, oldDesc: string, newDesc: string}> = [];

    items.forEach((item: any) => {
      const fixed = fixDescription(item.description);
      if (fixed !== item.description) {
        toFix.push({
          id: item._id,
          name: item.name,
          oldDesc: item.description,
          newDesc: fixed
        });
      }
    });

    console.log(`Found ${toFix.length} descriptions to fix:\n`);

    // Show first 10 as examples
    toFix.slice(0, 10).forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.name}:`);
      console.log(`   FROM: "${fix.oldDesc}"`);
      console.log(`   TO:   "${fix.newDesc}"`);
      console.log('');
    });

    if (toFix.length > 10) {
      console.log(`... and ${toFix.length - 10} more\n`);
    }

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
    console.error('Error fixing descriptions:', error);
  }
}

fixAllDescriptions();
