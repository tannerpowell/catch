import { getSanityClient } from '../lib/sanity-config';

const client = getSanityClient('2025-11-22');

async function checkDentonItems() {
  console.log('Checking Denton location menu items...\n');

  // Get all menu items with populated location references
  const allItems = await client.fetch(`
    *[_type == "menuItem"] {
      _id,
      name,
      slug,
      image,
      locationOverrides[] {
        ...,
        location-> { "slug": slug.current }
      }
    }
  `);

  console.log(`Total menu items in database: ${allItems.length}\n`);

  // Count items available at Denton
  let dentonItems = 0;
  let dentonItemsWithImages = 0;
  let itemsWithNoLocationOverrides = 0;
  let itemsExplicitlyAvailableAtDenton = 0;

  allItems.forEach((item: any) => {
    // Items with no location overrides are available everywhere
    if (!item.locationOverrides || !Array.isArray(item.locationOverrides) || item.locationOverrides.length === 0) {
      dentonItems++;
      itemsWithNoLocationOverrides++;
      if (item.image) dentonItemsWithImages++;
    } else {
      // Check if Denton has an override
      const dentonOverride = item.locationOverrides.find((override: any) => 
        override.location?.slug === 'denton'
      );
      if (dentonOverride) {
        // If override exists and available !== false, item is available
        if (dentonOverride.available !== false) {
          dentonItems++;
          itemsExplicitlyAvailableAtDenton++;
          if (item.image) dentonItemsWithImages++;
        }
      }
      // If no override for Denton, item is NOT available there
    }
  });

  console.log(`Items available at Denton: ${dentonItems}`);
  console.log(`  - Items with no location overrides (available everywhere): ${itemsWithNoLocationOverrides}`);
  console.log(`  - Items explicitly available at Denton: ${itemsExplicitlyAvailableAtDenton}`);
  console.log(`\nItems with images at Denton: ${dentonItemsWithImages}`);
  console.log(`Items without images at Denton: ${dentonItems - dentonItemsWithImages}\n`);

  // Check other locations for comparison
  const locations = ['atascocita', 'post-oak', 'coit-campbell', 'garland'];

  console.log('Comparison with other locations:\n');

  for (const loc of locations) {
    let locItems = 0;
    let locItemsWithImages = 0;

    allItems.forEach((item: any) => {
      if (!item.locationOverrides || !Array.isArray(item.locationOverrides) || item.locationOverrides.length === 0) {
        locItems++;
        if (item.image) locItemsWithImages++;
      } else {
        const locOverride = item.locationOverrides.find((override: any) => 
          override.location?.slug === loc
        );
        if (locOverride && locOverride.available !== false) {
          locItems++;
          if (item.image) locItemsWithImages++;
        }
      }
    });

    console.log(`${loc}: ${locItems} items (${locItemsWithImages} with images)`);
  }

  // Show sample of Denton items without images
  console.log('\nSample of Denton items without images:');
  let count = 0;
  for (const item of allItems) {
    if (count >= 10) break;

    let availableAtDenton = false;
    if (!item.locationOverrides || !Array.isArray(item.locationOverrides) || item.locationOverrides.length === 0) {
      availableAtDenton = true;
    } else {
      const dentonOverride = item.locationOverrides.find((override: any) => 
        override.location?.slug === 'denton'
      );
      if (dentonOverride && dentonOverride.available !== false) {
        availableAtDenton = true;
      }
    }

    if (availableAtDenton && !item.image) {
      console.log(`  - ${item.name} (${item.slug || 'no-slug'})`);
      count++;
    }
  }
}

checkDentonItems();
