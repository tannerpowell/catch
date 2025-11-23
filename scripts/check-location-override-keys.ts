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

async function checkLocationOverrideKeys() {
  console.log('Checking what location override keys exist...\n');

  const items = await client.fetch(`
    *[_type == "menuItem" && defined(locationOverrides)] {
      _id,
      name,
      locationOverrides
    }
  `);

  const allKeys = new Set<string>();

  items.forEach((item: any) => {
    if (item.locationOverrides) {
      Object.keys(item.locationOverrides).forEach(key => allKeys.add(key));
    }
  });

  console.log(`Found ${items.length} items with locationOverrides\n`);
  console.log('Unique location override keys:');
  Array.from(allKeys).sort().forEach(key => {
    console.log(`  - ${key}`);
  });

  // Also check actual location documents
  console.log('\n\nChecking location documents in Sanity:\n');

  const locations = await client.fetch(`
    *[_type == "location"] {
      _id,
      name,
      slug
    }
  `);

  console.log(`Found ${locations.length} location documents:`);
  locations.forEach((loc: any) => {
    console.log(`  - ${loc.name} → slug: ${loc.slug?.current || 'NO SLUG'}`);
  });
}

checkLocationOverrideKeys();
