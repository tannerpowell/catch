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

  // Fix Étouffée capitalization (capital É at start of word only)
  fixed = fixed.replace(/\bétouffée\b/gi, 'étouffée');
  fixed = fixed.replace(/\bÉtouffée\b/g, 'Étouffée');
  fixed = fixed.replace(/([.!?]\s+)étouffée/g, '$1Étouffée');
  fixed = fixed.replace(/^étouffée/g, 'Étouffée');

  // Remove spaces in fractions: "1/4 lb" → "1/4lb", "1/2 lb" → "1/2lb"
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2');

  // Lowercase "filet" and "filets"
  fixed = fixed.replace(/\bFilets?\b/g, (match) => match.toLowerCase());

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

  // Special case: Move cooking methods before item when in this pattern:
  // "2 Oysters (Fried, Grilled or Blackened)" → "fried, grilled or blackened Oysters (2)"
  fixed = fixed.replace(/(\d+)\s+(Oysters?|Catfish|Whitefish)\s+\((Fried|Grilled|Blackened)(?:,?\s+(?:Fried|Grilled|Blackened|or))*\)/gi,
    (match, num, protein, ...rest) => {
      const fullMatch = match;
      const methodsMatch = fullMatch.match(/\(([^)]+)\)/);
      if (methodsMatch) {
        const methods = methodsMatch[1].toLowerCase();
        return `${methods} ${protein} (${num})`;
      }
      return match;
    }
  );

  // Fix quantity lists with "or":
  // "5, 8 or Jumbo Shrimp (12)" → "5, 8 or 12 Jumbo Shrimp"
  // "Choice of 4, 6 or Jumbo Shrimp (8)" → "Choice of 4, 6 or 8 Jumbo Shrimp"
  fixed = fixed.replace(/(\d+),\s*(\d+)\s+or\s+(?:Jumbo Shrimp|jumbo shrimp)\s*\((\d+)\)/gi,
    (match, num1, num2, num3) => {
      return `${num1}, ${num2} or ${num3} Jumbo Shrimp`;
    }
  );

  // Also handle three number lists
  fixed = fixed.replace(/(\d+),\s*(\d+),?\s*or\s*(\d+)\s+(?:Filets?|filets?)/gi,
    (match, num1, num2, num3) => {
      return `${num1}, ${num2} or ${num3} filets`;
    }
  );

  // Move quantities for proteins ONLY when NOT a choice list
  // "2 Catfish, 1 Whitefish" → "Catfish (2), Whitefish (1)"
  // But keep "5, 8 or 12 Jumbo Shrimp" as is
  fixed = fixed.replace(/(?<![,\d]\s)(?<!\bor\s)(\d+)\s+(Catfish|Whitefish|Oysters?|Crawfish Tails?|Gator|Tenders?)\b(?!\s*\()/gi,
    (match, num, protein) => {
      // Check if this is followed by cooking method parentheses
      const capitalizedProtein = protein.charAt(0).toUpperCase() + protein.slice(1).toLowerCase();
      return `${capitalizedProtein} (${num})`;
    }
  );

  // Ensure main proteins are capitalized
  fixed = fixed.replace(/\b(catfish|whitefish|shrimp|oysters?|crawfish|gator|chicken|tenders?)\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });

  // But "Jumbo Shrimp" should stay capitalized as a unit
  fixed = fixed.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp');

  // Handle "Fried Oysters" as a compound name (when not preceded by cooking method list)
  // This should stay capitalized when it's the item name, not a cooking method
  fixed = fixed.replace(/\bFried (Oysters?)\b/g, (match, protein) => {
    // Check if preceded by "and" or comma - likely part of a list, keep capitalized
    return `Fried ${protein}`;
  });

  // Fix cooking methods in parentheses to lowercase
  fixed = fixed.replace(/\((fried|grilled|blackened|boiled)(?:\s+or\s+(fried|grilled|blackened|boiled))?\)/gi,
    (match) => match.toLowerCase()
  );

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

    // Show first 20 as examples
    toFix.slice(0, 20).forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.name}:`);
      console.log(`   FROM: "${fix.oldDesc}"`);
      console.log(`   TO:   "${fix.newDesc}"`);
      console.log('');
    });

    if (toFix.length > 20) {
      console.log(`... and ${toFix.length - 20} more\n`);
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
