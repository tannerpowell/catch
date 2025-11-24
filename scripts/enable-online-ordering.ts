/**
 * Enable online ordering for all locations (demo mode)
 *
 * This script sets onlineOrderingEnabled: true for all locations
 * to enable the cart/checkout demo system.
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
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
