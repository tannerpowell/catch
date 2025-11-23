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

  // Remove markdown formatting like **fried** or **Fried**
  fixed = fixed.replace(/\*\*(fried|Fried|grilled|Grilled|blackened|Blackened)\*\*/gi, (match, word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  // Fix measurements: "1 Pound" → "1lb", "2 Pounds" → "2lb", "1/2 LB" → "1/2lb"
  fixed = fixed.replace(/(\d+(?:\/\d+)?)\s*(?:LB|Pound|Pounds?)\b/gi, (match, num) => {
    return `${num}lb`;
  });

  // Fix "Corn & Potatoes" or "(1) Corn & (2) Potatoes" to proper format
  fixed = fixed.replace(/,?\s*\((\d+)\)\s*Corn\s*&\s*\((\d+)\)\s*Potatoes\.?/gi, (match, cornNum, potatoNum) => {
    return `with corn-on-the-cob (${cornNum}) and potatoes (${potatoNum})`;
  });

  // Simpler pattern for just "Corn & Potatoes"
  fixed = fixed.replace(/,?\s*Corn\s*&\s*Potatoes\.?/gi, ', corn-on-the-cob & potatoes');

  // Fix "corn-on-the-cob & potatoes" at start of clause
  fixed = fixed.replace(/with corn-on-the-cob & potatoes$/i, 'with corn-on-the-cob (1) and potatoes (2)');

  // Fix quantity format for proteins in lists:
  // "8 Catfish, 12 jumbo shrimp" → "Catfish (8), Jumbo Shrimp (12)"
  // But NOT for choice lists like "5, 8 or 12 Jumbo Shrimp"
  fixed = fixed.replace(/(\d+)\s+(Catfish|Whitefish|jumbo shrimp|Jumbo Shrimp|tenders|Chicken Tenders)\s*(?:,|&)/gi,
    (match, num, protein) => {
      // Normalize protein name
      let normalizedProtein = protein.toLowerCase();
      if (normalizedProtein === 'jumbo shrimp') {
        normalizedProtein = 'Jumbo Shrimp';
      } else if (normalizedProtein === 'tenders' || normalizedProtein === 'chicken tenders') {
        normalizedProtein = 'Chicken Tenders';
      } else {
        normalizedProtein = protein.charAt(0).toUpperCase() + protein.slice(1).toLowerCase();
      }

      const separator = match.endsWith(',') ? ',' : ' &';
      return `${normalizedProtein} (${num})${separator}`;
    }
  );

  // Handle end of list: "& 8 tenders" → "& Chicken Tenders (8)"
  fixed = fixed.replace(/&\s*(\d+)\s+(tenders|Chicken Tenders)(?!\s*\()/gi,
    (match, num, protein) => {
      return `& Chicken Tenders (${num})`;
    }
  );

  // Fix standalone numbers before Jumbo Shrimp (not part of choice list)
  // "24 Jumbo shrimp" → "24 Jumbo Shrimp" (just capitalize)
  fixed = fixed.replace(/(\d+)\s+Jumbo shrimp\b/g, '$1 Jumbo Shrimp');

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

    const toFix: Array<{id: string, name: string, field: 'name' | 'description', oldValue: string, newValue: string}> = [];

    items.forEach((item: any) => {
      // Check name
      if (item.name) {
        const fixedName = fixDescription(item.name);
        if (fixedName !== item.name) {
          toFix.push({
            id: item._id,
            name: item.name,
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
            name: item.name,
            field: 'description',
            oldValue: item.description,
            newValue: fixedDesc
          });
        }
      }
    });

    console.log(`Found ${toFix.length} fields to fix:\n`);

    // Show first 20 as examples
    toFix.slice(0, 20).forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.name} [${fix.field}]:`);
      console.log(`   FROM: "${fix.oldValue}"`);
      console.log(`   TO:   "${fix.newValue}"`);
      console.log('');
    });

    if (toFix.length > 20) {
      console.log(`... and ${toFix.length - 20} more\n`);
    }

    if (toFix.length > 0) {
      console.log('\nApplying fixes...\n');

      for (const fix of toFix) {
        await client.patch(fix.id).set({ [fix.field]: fix.newValue }).commit();
        console.log(`✓ Fixed: ${fix.name} [${fix.field}]`);
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
