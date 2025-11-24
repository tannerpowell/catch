/**
 * Enable online ordering for all locations (demo mode)
 *
 * This script sets onlineOrderingEnabled: true for all locations
 * to enable the cart/checkout demo system.
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease ensure these are set in your .env.local file.');
  process.exit(1);
}

const client = createClient({
  projectId: requiredEnvVars.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: requiredEnvVars.NEXT_PUBLIC_SANITY_DATASET,
  token: requiredEnvVars.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function enableOnlineOrdering() {
  console.log('🚀 Enabling online ordering for all locations...\n');

  // Fetch all locations
  const locations = await client.fetch(`*[_type == "location"] {
    _id,
    name,
    onlineOrderingEnabled,
    acceptingOrders,
    orderTypes
  }`);

  console.log(`Found ${locations.length} locations:\n`);

  // Update each location
  for (const location of locations) {
    console.log(`📍 ${location.name}`);
    console.log(`   Current: onlineOrderingEnabled = ${location.onlineOrderingEnabled}`);

    if (!location.onlineOrderingEnabled) {
      await client
        .patch(location._id)
        .set({
          onlineOrderingEnabled: true,
          acceptingOrders: true,
          orderTypes: ['pickup', 'delivery'],
        })
        .commit();

      console.log(`   ✅ Updated: onlineOrderingEnabled = true\n`);
    } else {
      console.log(`   ✓ Already enabled\n`);
    }
  }

  console.log('✅ Done! Online ordering is now enabled for all locations.');
}

enableOnlineOrdering().catch(console.error);
