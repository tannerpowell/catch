/**
 * Delete the old "DFW Site" placeholder location
 */
import { getSanityClient } from '../lib/sanity-config';
import path from 'path';

const client = getSanityClient('2025-11-22');

async function main() {
  console.log("Deleting DFW placeholder location...");

  try {
    await client.delete("location-dfw");
    console.log("✅ Deleted location-dfw");
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("⚠️  location-dfw already deleted or doesn't exist");
    } else {
      console.error("Error:", err.message);
    }
  }

  // Verify final locations
  const locations = await client.fetch(
    `*[_type == "location"] | order(name asc) { "slug": slug.current, name, storeId }`
  );

  console.log(`\n✅ Final location count: ${locations.length}`);
  locations.forEach((loc: any) => {
    console.log(`  - ${loc.slug}: ${loc.name} (storeId: ${loc.storeId || 'none'})`);
  });
}

main().catch(console.error);
