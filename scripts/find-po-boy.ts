import { getSanityClient } from '../lib/sanity-config';

const client = getSanityClient('2025-11-22');

// Helper function to preserve case when replacing Po Boy variants
function normalizePoboy(text: string): string {
  return text.replace(/(po[\s\-]?boy|poboy)/gi, (match: string) => {
    // Preserve original case: if first letter is uppercase, return "Po' Boy", else "po' boy"
    const isCapitalized = match[0].toUpperCase() === match[0];
    return isCapitalized ? "Po' Boy" : "po' boy";
  });
}

async function findPoboy() {
  try {
    console.log('Searching for all Po Boy variants in Sanity...\n');

    // Search in menu item names and descriptions
    const items = await client.fetch(`
      *[_type == "menuItem" && (
        name match "*Po Boy*" ||
        name match "*po boy*" ||
        name match "*Po-Boy*" ||
        name match "*po-boy*" ||
        name match "*Poboy*" ||
        name match "*poboy*" ||
        description match "*Po Boy*" ||
        description match "*po boy*" ||
        description match "*Po-Boy*" ||
        description match "*po-boy*" ||
        description match "*Poboy*" ||
        description match "*poboy*"
      )] {
        _id,
        name,
        description,
        "slug": slug.current
      }
    `);

    console.log(`Found ${items.length} items with 'Po Boy' variants in name or description:\n`);

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
      // Check name - replace various Po Boy variants with case-preserving logic
      if (item.name) {
        const fixed = normalizePoboy(item.name);

        if (fixed !== item.name) {
          toFix.push({
            id: item._id,
            field: 'name',
            oldValue: item.name,
            newValue: fixed
          });
        }
      }

      // Check description - use same case-preserving logic
      if (item.description) {
        const fixed = normalizePoboy(item.description);

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
    console.error('Error finding Po Boy:', error);
  }
}

findPoboy();
