/**
 * Create test orders in Sanity for kitchen dashboard testing
 *
 * Run with: npx tsx scripts/create-test-orders.ts
 */

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  const missing: string[] = [];
  if (!projectId) missing.push('NEXT_PUBLIC_SANITY_PROJECT_ID');
  if (!dataset) missing.push('NEXT_PUBLIC_SANITY_DATASET');
  if (!token) missing.push('SANITY_WRITE_TOKEN');
  
  console.error('❌ Configuration Error: Missing required environment variables\n');
  for (const variable of missing) {
    console.error(`  • ${variable}`);
  }
  console.error('\nRequired setup:');
  console.error('  1. Create a .env.local file in the project root');
  console.error('  2. Add these variables:');
  console.error('     NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id');
  console.error('     NEXT_PUBLIC_SANITY_DATASET=your_dataset');
  console.error('     SANITY_WRITE_TOKEN=your_write_token');
  console.error('  3. Get these values from https://manage.sanity.io\n');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: '2024-01-01',
  token
});

/**
 * Creates three sample order documents in Sanity for kitchen dashboard testing.
 *
 * Fetches up to three `location` documents and, if at least one exists, creates
 * three predefined orders that reference the first location and include
 * customer, item, pricing, and timestamp fields. Exits early if no locations
 * are found.
 */
async function createTestOrders() {
  console.log('🔍 Fetching locations...');
  const locations = await client.fetch(`*[_type == "location"][0...3]`);

  if (locations.length === 0) {
    console.error('❌ No locations found. Please create locations first.');
    return;
  }

  console.log(`✅ Found ${locations.length} locations`);

  const testOrders = [
    {
      orderNumber: `ORD-${Date.now()}-001`,
      status: 'confirmed',
      location: { _type: 'reference', _ref: locations[0]._id },
      locationSnapshot: {
        name: locations[0].name,
        address: locations[0].address?.street || '',
        phone: locations[0].phone || ''
      },
      customer: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '214-555-0101',
        marketingOptIn: false
      },
      orderType: 'pickup',
      items: [
        {
          menuItemSnapshot: {
            name: 'Fried Catfish Basket',
            description: 'Golden fried catfish with fries',
            basePrice: 14.99
          },
          quantity: 2,
          price: 14.99,
          totalPrice: 29.98,
          modifiers: [
            { name: 'Side', option: 'Fries', priceDelta: 0 },
            { name: 'Sauce', option: 'Tartar', priceDelta: 0 }
          ],
          specialInstructions: 'Extra crispy please'
        },
        {
          menuItemSnapshot: {
            name: 'Shrimp Boil',
            description: 'Cajun-spiced shrimp boil',
            basePrice: 18.99
          },
          quantity: 1,
          price: 18.99,
          totalPrice: 18.99,
          modifiers: [
            { name: 'Spice Level', option: 'Medium', priceDelta: 0 }
          ]
        }
      ],
      subtotal: 48.97,
      tax: 4.04,
      taxRate: 0.0825,
      tip: 0,
      deliveryFee: 0,
      platformFee: 0,
      total: 53.01,
      locationPayout: 53.01,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    },
    {
      orderNumber: `ORD-${Date.now()}-002`,
      status: 'preparing',
      location: { _type: 'reference', _ref: locations[0]._id },
      locationSnapshot: {
        name: locations[0].name,
        address: locations[0].address?.street || '',
        phone: locations[0].phone || ''
      },
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '214-555-0102',
        marketingOptIn: true
      },
      orderType: 'pickup',
      items: [
        {
          menuItemSnapshot: {
            name: 'Crawfish Basket',
            description: 'Louisiana crawfish with corn and potatoes',
            basePrice: 22.99
          },
          quantity: 1,
          price: 22.99,
          totalPrice: 22.99,
          modifiers: [
            { name: 'Spice Level', option: 'Hot', priceDelta: 0 }
          ]
        }
      ],
      subtotal: 22.99,
      tax: 1.90,
      taxRate: 0.0825,
      tip: 5.00,
      deliveryFee: 0,
      platformFee: 0,
      total: 29.89,
      locationPayout: 29.89,
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(), // 12 minutes ago
      confirmedAt: new Date(Date.now() - 12 * 60000).toISOString(),
      preparingAt: new Date(Date.now() - 5 * 60000).toISOString(), // Started 5 min ago
      specialInstructions: 'Please make sure it\'s nice and spicy!'
    },
    {
      orderNumber: `ORD-${Date.now()}-003`,
      status: 'ready',
      location: { _type: 'reference', _ref: locations[0]._id },
      locationSnapshot: {
        name: locations[0].name,
        address: locations[0].address?.street || '',
        phone: locations[0].phone || ''
      },
      customer: {
        name: 'Mike Davis',
        email: 'mike@example.com',
        phone: '214-555-0103',
        marketingOptIn: false
      },
      orderType: 'pickup',
      items: [
        {
          menuItemSnapshot: {
            name: 'Combo Basket',
            description: 'Catfish, shrimp, and fries',
            basePrice: 19.99
          },
          quantity: 2,
          price: 19.99,
          totalPrice: 39.98,
          modifiers: []
        }
      ],
      subtotal: 39.98,
      tax: 3.30,
      taxRate: 0.0825,
      tip: 8.00,
      deliveryFee: 0,
      platformFee: 0,
      total: 51.28,
      locationPayout: 51.28,
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
      confirmedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      preparingAt: new Date(Date.now() - 20 * 60000).toISOString(),
      readyAt: new Date(Date.now() - 2 * 60000).toISOString() // Ready 2 min ago
    }
  ];

  console.log(`\n📝 Creating ${testOrders.length} test orders...`);

  for (const order of testOrders) {
    try {
      const result = await client.create({
        _type: 'order',
        ...order
      });
      console.log(`✅ Created order ${order.orderNumber} (${order.status})`);
    } catch (error) {
      console.error(`❌ Failed to create order ${order.orderNumber}:`, error);
    }
  }

  console.log('\n✨ Done! Visit http://localhost:3000/kitchen to see orders');
}

createTestOrders().catch(console.error);