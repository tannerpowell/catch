import { getSanityClient } from '../lib/sanity-config';

const client = getSanityClient('2025-11-22');

function fixDescription(desc: string): string {
  if (!desc) return desc;

  let fixed = desc;

  // Fix Étouffée capitalization (capital É at start of word only)
  fixed = fixed.replace(/\bétouffée\b/gi, 'étouffée');
  fixed = fixed.replace(/\bÉtouffée\b/g, 'Étouffée');
  fixed = fixed.replace(/([.!?]\s+)étouffée/g, '$1Étouffée');
  fixed = fixed.replace(/^étouffée/g, 'Étouffée');

  // Remove spaces in fractions: "1/4 lb" → "1/4lb", "1/2 lb" → "1/2lb"
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2');

  // Lowercase generic food terms (NOT proteins)
  fixed = fixed.replace(/\bSide Item\b/g, 'side item');
  fixed = fixed.replace(/\bHush Puppies\b/g, 'hush puppies');
  fixed = fixed.replace(/\bDiced Tomato\b/g, 'diced tomato');
  fixed = fixed.replace(/\bGreen Onion\b/g, 'green onion');
  fixed = fixed.replace(/\bBacon Bits\b/g, 'bacon bits');
  fixed = fixed.replace(/\bSour Cream\b/g, 'sour cream');

  // Fix Monterey Jack (proper noun - keep capitalized, but fix spelling if needed)
  fixed = fixed.replace(/\bMonterrey Jack Cheese\b/gi, 'Monterey Jack cheese');
  fixed = fixed.replace(/\bMonterrey Jack\b/gi, 'Monterey Jack');

  // Fix cooking method parentheses - lowercase
  fixed = fixed.replace(/\((Fried|Grilled|Blackened|Boiled)(,?\s+(Fried|Grilled|Blackened|Boiled))*\)/gi, (match) => {
    return match.toLowerCase();
  });

  // Move quantities for proteins ONLY when NOT a choice list
  // "2 Catfish, 1 Whitefish" → "Catfish (2), Whitefish (1)"
  // But keep "5, 8 or 12 Jumbo Shrimp" as is

  // Match pattern: single number followed by protein (not preceded by "or" or comma+number)
  fixed = fixed.replace(/(?<![,\d]\s)(?<!\bor\s)(\d+)\s+(Catfish|Whitefish|Oysters?|Crawfish Tails?|Gator|Tenders?)\b(?!\s*,\s*\d+\s+\w+\s+or)/gi, (match, num, protein) => {
    // Capitalize the protein properly
    const capitalizedProtein = protein.charAt(0).toUpperCase() + protein.slice(1).toLowerCase();
    return `${capitalizedProtein} (${num})`;
  });

  // Ensure main proteins are capitalized
  fixed = fixed.replace(/\b(catfish|whitefish|shrimp|oysters?|crawfish|gator|chicken)\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });

  // But "Jumbo Shrimp" should stay capitalized as a unit
  fixed = fixed.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp');

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

    // Show first 15 as examples
    toFix.slice(0, 15).forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.name}:`);
      console.log(`   FROM: "${fix.oldDesc}"`);
      console.log(`   TO:   "${fix.newDesc}"`);
      console.log('');
    });

    if (toFix.length > 15) {
      console.log(`... and ${toFix.length - 15} more\n`);
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
