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

async function findAnomalies() {
  const items = await client.fetch(`
    *[_type == "menuItem"] {
      _id,
      name,
      slug,
      image,
      price,
      locationOverrides,
      category->{title, slug}
    }
  `);

  console.log(`Analyzing ${items.length} menu items...\n`);

  // 1. Find duplicates by name
  const nameGroups = new Map<string, any[]>();
  items.forEach((item: any) => {
    const name = item.name.trim();
    if (!nameGroups.has(name)) {
      nameGroups.set(name, []);
    }
    nameGroups.get(name)!.push(item);
  });

  const duplicates = Array.from(nameGroups.entries()).filter(([_, items]) => items.length > 1);

  if (duplicates.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('DUPLICATES BY NAME');
    console.log('═══════════════════════════════════════════════════════\n');

    duplicates.forEach(([name, dupes]) => {
      console.log(`"${name}" - ${dupes.length} copies:`);
      dupes.forEach((item: any, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${item._id}`);
        console.log(`     Has Image: ${!!item.image}`);
        console.log(`     Price: $${item.price || 'none'}`);
        console.log(`     Category: ${item.category?.title || 'none'}`);
        console.log(`     Location Overrides: ${item.locationOverrides ? Object.keys(item.locationOverrides).length : 0}`);
      });
      console.log('');
    });
  }

  // 2. Find items with no category
  const noCategory = items.filter((item: any) => !item.category);
  if (noCategory.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('ITEMS WITH NO CATEGORY');
    console.log('═══════════════════════════════════════════════════════\n');

    noCategory.forEach((item: any) => {
      console.log(`- ${item.name} (${item._id})`);
    });
    console.log('');
  }

  // 3. Find items with no price
  const noPrice = items.filter((item: any) => item.price == null);
  if (noPrice.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('ITEMS WITH NO PRICE');
    console.log('═══════════════════════════════════════════════════════\n');

    noPrice.forEach((item: any) => {
      console.log(`- ${item.name} (${item._id})`);
    });
    console.log('');
  }

  // 4. Find items with suspicious IDs (likely imports gone wrong)
  const suspiciousIds = items.filter((item: any) =>
    item._id.includes('-1-') ||
    item._id.includes('-2-') ||
    item._id.includes('-105-') ||
    item._id.match(/menuItem-\d+-.*-\d+-/)
  );

  if (suspiciousIds.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('ITEMS WITH SUSPICIOUS IDS (likely bad imports)');
    console.log('═══════════════════════════════════════════════════════\n');

    suspiciousIds.forEach((item: any) => {
      console.log(`- ${item.name}`);
      console.log(`  ID: ${item._id}`);
      console.log(`  Has Image: ${!!item.image}`);
      console.log(`  Has Location Data: ${item.locationOverrides ? Object.keys(item.locationOverrides).length > 0 : false}`);
      console.log('');
    });
  }

  // 5. Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Total items: ${items.length}`);
  console.log(`Duplicate names: ${duplicates.length} (${duplicates.reduce((sum, [_, dupes]) => sum + dupes.length, 0)} total items)`);
  console.log(`No category: ${noCategory.length}`);
  console.log(`No price: ${noPrice.length}`);
  console.log(`Suspicious IDs: ${suspiciousIds.length}`);
  console.log('');

  // Calculate potential for cleanup
  let canDelete = 0;
  duplicates.forEach(([_, dupes]) => {
    // For each duplicate group, we can potentially delete all but the best one
    const withImage = dupes.filter((d: any) => d.image);
    const withLocationData = dupes.filter((d: any) => d.locationOverrides && Object.keys(d.locationOverrides).length > 0);

    // If there's one clear winner (has image + location data), we can delete the rest
    if (withImage.length === 1 && withLocationData.length <= 1) {
      canDelete += dupes.length - 1;
    }
  });

  console.log(`Estimated items safe to delete: ~${canDelete}`);
}

findAnomalies();
