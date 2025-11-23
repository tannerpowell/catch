import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import groq from 'groq';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function findDentonItems() {
  console.log('Finding items available at Denton...\n');

  // Use the same query as the adapter
  const items = await client.fetch(groq`*[_type=="menuItem"]{
    _id,
    name,
    "slug": slug.current,
    "image": image.asset->url,
    "overrides": coalesce(locationOverrides, [])[]{
      "loc": location->slug.current,
      price,
      available
    }
  }`);

  console.log(`Total items: ${items.length}\n`);

  // Count items available at each location
  const locationCounts: Record<string, number> = {};
  const locationWithImages: Record<string, number> = {};

  items.forEach((item: any) => {
    const overrides = item.overrides || [];

    overrides.forEach((override: any) => {
      const loc = override.loc;
      if (!loc) return;

      // Only count if available !== false
      if (override.available === false) return;

      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      if (item.image) {
        locationWithImages[loc] = (locationWithImages[loc] || 0) + 1;
      }
    });
  });

  console.log('Items per location:');
  Object.entries(locationCounts).sort().forEach(([loc, count]) => {
    const withImages = locationWithImages[loc] || 0;
    console.log(`  ${loc}: ${count} items (${withImages} with images)`);
  });

  // Show sample Denton items
  console.log('\n\nSample items available at Denton:');
  let count = 0;
  for (const item of items) {
    if (count >= 10) break;

    const dentonOverride = item.overrides?.find((o: any) => o.loc === 'denton');
    if (dentonOverride && dentonOverride.available !== false) {
      console.log(`  - ${item.name} (${item.slug || 'no-slug'}) - Price: $${dentonOverride.price} - Image: ${item.image ? 'Yes' : 'No'}`);
      count++;
    }
  }

  if (count === 0) {
    console.log('  No items found for Denton!\n');

    // Check if Denton location exists
    const locations = await client.fetch(groq`*[_type=="location"]{ name, "slug": slug.current }`);
    console.log('\nAll locations in database:');
    locations.forEach((loc: any) => {
      console.log(`  - ${loc.name} (${loc.slug})`);
    });
  }
}

findDentonItems();
