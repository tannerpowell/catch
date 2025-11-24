/**
 * Setup Script: Create Stripe Connected Accounts for All Locations
 *
 * This script:
 * 1. Fetches all locations from Sanity
 * 2. Creates a Stripe Express Connected Account for each
 * 3. Generates onboarding links
 * 4. Updates Sanity with account IDs and links
 *
 * Run with: npx tsx scripts/ecommerce/setup-stripe-locations.ts
 */

import Stripe from 'stripe';
import { createClient } from '@sanity/client';

// Validate required environment variables upfront
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
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

// Validate BASE_URL is a fully qualified HTTPS URL
const baseUrl = requiredEnvVars.NEXT_PUBLIC_BASE_URL;
if (baseUrl && !baseUrl.startsWith('https://') && !baseUrl.startsWith('http://localhost')) {
  console.error('❌ NEXT_PUBLIC_BASE_URL must be a fully qualified HTTPS URL');
  console.error(`   Current value: ${baseUrl}`);
  console.error('   Example: https://thecatch.com');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Sanity client
const sanityClient = createClient({
  projectId: requiredEnvVars.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: requiredEnvVars.SANITY_API_TOKEN!,
  useCdn: false,
  apiVersion: '2024-01-01',
});

interface SanityLocation {
  _id: string;
  name: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  stripeAccountId?: string;
}

async function createConnectedAccounts() {
  console.log('🚀 Starting Stripe Connect setup for The Catch locations...\n');

  try {
    // Fetch all locations from Sanity
    const locations = await sanityClient.fetch<SanityLocation[]>(`
      *[_type == "location"]{
        _id,
        name,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        stripeAccountId
      }
    `);

    console.log(`📍 Found ${locations.length} locations\n`);

    for (const location of locations) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${location.name}`);
      console.log('='.repeat(60));

      // Skip if already has Stripe account
      if (location.stripeAccountId) {
        console.log(`⚠️  Already has Stripe account: ${location.stripeAccountId}`);
        console.log('   Skipping... (delete stripeAccountId in Sanity to recreate)');
        continue;
      }

      // Validate email
      if (!location.email) {
        console.log(`❌ No email found for ${location.name}`);
        console.log('   Please add an email in Sanity and run again');
        continue;
      }

      try {
        // Create Express connected account
        console.log(`📝 Creating Stripe Express account...`);

        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: location.email,
          business_type: 'company',
          company: {
            name: location.name,
            address: {
              line1: location.addressLine1,
              line2: location.addressLine2 || undefined,
              city: location.city,
              state: location.state,
              postal_code: location.postalCode,
              country: 'US',
            },
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          settings: {
            payouts: {
              schedule: {
                interval: 'daily', // Daily automatic payouts
              },
            },
          },
        });

        console.log(`✅ Created account: ${account.id}`);

        // Generate onboarding link
        console.log(`🔗 Generating onboarding link...`);

        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${requiredEnvVars.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect/refresh`,
          return_url: `${requiredEnvVars.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect/success`,
          type: 'account_onboarding',
        });

        console.log(`✅ Onboarding link created`);

        // Generate Express dashboard link
        const loginLink = await stripe.accounts.createLoginLink(account.id);

        // Update Sanity with Stripe account details
        console.log(`💾 Updating Sanity...`);

        await sanityClient
          .patch(location._id)
          .set({
            stripeAccountId: account.id,
            stripeOnboardingLink: accountLink.url,
            stripeDashboardLink: loginLink.url,
            stripeOnboardingComplete: false,
            stripeChargesEnabled: false,
            stripePayoutsEnabled: false,
          })
          .commit();

        console.log(`✅ Sanity updated`);
        console.log(`\n📧 ONBOARDING LINK for ${location.name}:`);
        console.log(`   ${accountLink.url}`);
        console.log(`\n   ⚠️  This link expires in 24 hours!`);
        console.log(`   Send to: ${location.email}`);

      } catch (error) {
        console.error(`❌ Error processing ${location.name}:`, error);
        continue;
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Setup complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Send onboarding links to location managers');
    console.log('2. Wait for them to complete onboarding (usually 5-10 minutes)');
    console.log('3. Run check-stripe-status.ts to verify accounts are ready');
    console.log('4. Enable onlineOrderingEnabled in Sanity for each location\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createConnectedAccounts();
