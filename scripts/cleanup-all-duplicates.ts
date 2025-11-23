import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_WRITE_TOKEN',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName] || process.env[varName]?.trim() === ''
);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease ensure these are set in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function cleanupAllDuplicates() {
  try {
    const items = await client.fetch(`
      *[_type == "menuItem"] {
        _id,
        name,
        slug,
        image,
        price,
        locationOverrides
      }
    `);

    console.log(`Analyzing ${items.length} menu items...\n`);

    // Group by name
    const nameGroups = new Map<string, any[]>();
    items.forEach((item: any) => {
      // Safely handle null/undefined/non-string names
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      
      // Skip items without a valid name
      if (!name) {
        console.warn(`⚠️  Skipping item ${item._id} with missing or invalid name`);
        return;
      }
      
      if (!nameGroups.has(name)) {
        nameGroups.set(name, []);
      }
      nameGroups.get(name)!.push(item);
    });

    const duplicateGroups = Array.from(nameGroups.entries()).filter(([_, items]) => items.length > 1);

    console.log(`Found ${duplicateGroups.length} items with duplicates\n`);

    let totalToDelete = 0;
    const deleteList: string[] = [];

    duplicateGroups.forEach(([name, dupes]) => {
      // Keep the one that starts with 'item-' (original)
      const keepItem = dupes.find((d: any) => d._id.startsWith('item-'));

      if (keepItem) {
        const toDelete = dupes.filter((d: any) => d._id !== keepItem._id);
        toDelete.forEach((d: any) => deleteList.push(d._id));
        totalToDelete += toDelete.length;
      } else {
        // No 'item-' found, keep the one with the most data
        const sorted = dupes.sort((a: any, b: any) => {
          const aScore = (a.image ? 1 : 0) + (a.price ? 1 : 0) + (a.locationOverrides ? Object.keys(a.locationOverrides).length : 0);
          const bScore = (b.image ? 1 : 0) + (b.price ? 1 : 0) + (b.locationOverrides ? Object.keys(b.locationOverrides).length : 0);
          return bScore - aScore;
        });

        const toDelete = sorted.slice(1); // Keep first, delete rest
        toDelete.forEach((d: any) => deleteList.push(d._id));
        totalToDelete += toDelete.length;

        console.log(`⚠️  No 'item-' prefix for "${name}", keeping: ${sorted[0]._id}`);
      }
    });

    console.log(`\nReady to delete ${totalToDelete} duplicate items`);
    console.log(`\nDeleting in batches...\n`);

    // Delete in batches of 50
    const batchSize = 50;
    for (let i = 0; i < deleteList.length; i += batchSize) {
      const batch = deleteList.slice(i, i + batchSize);
      try {
        await Promise.all(batch.map(id => client.delete(id)));
        console.log(`✓ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
      } catch (batchError) {
        console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        throw batchError;
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalToDelete} duplicate items.`);
    console.log(`Remaining items: ${items.length - totalToDelete}`);
  } catch (error) {
    console.error('❌ Fatal error during cleanup:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

cleanupAllDuplicates();
