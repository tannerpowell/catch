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

async function inspectLocationOverrides() {
  console.log('Inspecting location overrides structure...\n');

  const items = await client.fetch(`
    *[_type == "menuItem"] | order(name asc) [0...5] {
      _id,
      name,
      price,
      locationOverrides
    }
  `);

  console.log('Sample of 5 menu items:\n');
  items.forEach((item: any) => {
    console.log(`${item.name}:`);
    console.log(`  Base price: ${item.price}`);
    console.log(`  Location overrides:`, JSON.stringify(item.locationOverrides, null, 2));
    console.log('');
  });
}

inspectLocationOverrides();
