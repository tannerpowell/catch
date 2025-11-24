/**
 * Enable online ordering for all locations (demo mode)
 *
 * This script sets onlineOrderingEnabled: true for all locations
 * to enable the cart/checkout demo system.
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { Location } from '../lib/types';

dotenv.config({ path: '.env.local' });

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  const missing: string[] = [];
  if (!projectId) missing.push('NEXT_PUBLIC_SANITY_PROJECT_ID');
  if (!dataset) missing.push('NEXT_PUBLIC_SANITY_DATASET');
  if (!token) missing.push('SANITY_API_TOKEN');
  
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Please ensure these are set in your .env.local file.'
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-11-24',
  useCdn: false,
});

/**
 * Enables online ordering for every `location` document in the Sanity dataset (demo mode).
 *
 * For each location whose `onlineOrderingEnabled` is false, sets `onlineOrderingEnabled` to `true`,
 * `acceptingOrders` to `true`, and `orderTypes` to `['pickup', 'delivery']`. Logs progress for each
 * processed location and a completion message.
 */
async function enableOnlineOrdering() {
  console.log('🚀 Enabling online ordering for all locations...\n');

  // Fetch all locations
  let locations: Location[];
  try {
    locations = await client.fetch(`*[_type == "location"] {
      _id,
      name,
      onlineOrderingEnabled,
      acceptingOrders,
      orderTypes
    }`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to fetch locations from Sanity:');
    console.error(`   Error: ${errorMessage}`);
    console.error('   Query: *[_type == "location"]');
    console.error('\nPossible causes:');
    console.error('   • Network connectivity issues');
    console.error('   • Invalid Sanity credentials');
    console.error('   • Incorrect project ID or dataset');
    console.error('   • Missing read permissions for the API token\n');
    process.exit(1);
  }

  console.log(`Found ${locations.length} locations:\n`);

  const failedLocations: Array<{ id: string; name: string; error: string }> = [];

  // Update each location
  for (const location of locations) {
    console.log(`📍 ${location.name}`);
    console.log(`   Current: onlineOrderingEnabled = ${location.onlineOrderingEnabled}`);

    if (!location.onlineOrderingEnabled) {
      try {
        await client
          .patch(location._id)
          .set({
            onlineOrderingEnabled: true,
            acceptingOrders: true,
            orderTypes: ['pickup', 'delivery'],
          })
          .commit();

        console.log(`   ✅ Updated: onlineOrderingEnabled = true\n`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to update location ${location._id}: ${errorMessage}\n`);
        failedLocations.push({
          id: location._id,
          name: location.name,
          error: errorMessage,
        });
      }
    } else {
      console.log(`   ✓ Already enabled\n`);
    }
  }

  if (failedLocations.length > 0) {
    console.log(`\n⚠️  ${failedLocations.length} location(s) failed to update:\n`);
    for (const failed of failedLocations) {
      console.log(`  • ${failed.name} (${failed.id}): ${failed.error}`);
    }
    console.log('');
  }

  const successCount = locations.length - failedLocations.length;
  console.log(`✅ Done! Online ordering enabled for ${successCount}/${locations.length} locations.`);
}

enableOnlineOrdering().catch(console.error);