import { getBrand } from '../lib/brand';

async function test() {
  const brand = getBrand();
  const items = await brand.getItems();

  console.log('Total items fetched:', items.length);

  // Check a DFW item
  const dfwItem = items.find(i => i.name === 'Fried Catfish');
  if (dfwItem) {
    console.log('\nDFW Item Example (Fried Catfish):');
    console.log('  locationOverrides:', JSON.stringify(dfwItem.locationOverrides, null, 2));
  }

  // Check a Houston item
  const houstonItem = items.find(i => i.name === 'Gator');
  if (houstonItem) {
    console.log('\nHouston Item Example (Gator):');
    console.log('  locationOverrides keys:', Object.keys(houstonItem.locationOverrides || {}));
  }

  // Count items that would show at each location using the same logic as MenuPageClient
  const locations = await brand.getLocations();

  console.log('\n--- Simulating MenuPageClient filtering ---');
  for (const location of locations) {
    const filteredItems = items.filter(item => {
      // Same logic as MenuPageClient.tsx
      if (item.locationOverrides && Object.keys(item.locationOverrides).length > 0) {
        const override = item.locationOverrides[location.slug];
        if (!override) return false;
        if (override.available === false) return false;
      }
      return true;
    });

    console.log(`${location.name} (${location.slug}): ${filteredItems.length} items`);
  }
}

test();
