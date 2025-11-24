/**
 * Check Stripe Account Status
 *
 * This script checks the status of all Stripe Connected Accounts
 * and updates Sanity with current capabilities.
 *
 * Run with: npx tsx scripts/check-stripe-status.ts
 */

import Stripe from 'stripe';
import { createClient } from '@sanity/client';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

interface SanityLocation {
  _id: string;
  name: string;
  stripeAccountId?: string;
}

/**
 * Checks Stripe connected account status for all locations and updates Sanity with each account's capabilities and onboarding state.
 *
 * For each location that has a Stripe account ID this function:
 * - Retrieves the Stripe account details and records whether charges and payouts are enabled.
 * - Attempts to generate a new onboarding link when requirements are pending.
 * - Updates the corresponding Sanity document fields: `stripeChargesEnabled`, `stripePayoutsEnabled`, and `stripeOnboardingComplete`.
 * - Logs a final summary grouping locations into ready, pending, and issues.
 */
async function checkAccountStatus() {
  console.log('🔍 Checking Stripe account status for all locations...\n');

  try {
    // Fetch all locations with Stripe accounts
    const locations = await sanityClient.fetch<SanityLocation[]>(`
      *[_type == "location" && defined(stripeAccountId)]{
        _id,
        name,
        stripeAccountId
      }
    `);

    if (locations.length === 0) {
      console.log('⚠️  No locations with Stripe accounts found');
      console.log('   Run setup-stripe-locations.ts first\n');
      return;
    }

    console.log(`📍 Found ${locations.length} locations with Stripe accounts\n`);

    const summary: {
      ready: string[];
      pending: string[];
      issues: string[];
    } = {
      ready: [],
      pending: [],
      issues: [],
    };

    for (const location of locations) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`${location.name}`);
      console.log('─'.repeat(60));

      if (!location.stripeAccountId) {
        console.log('⚠️  No Stripe account ID');
        summary.issues.push(location.name);
        continue;
      }

      try {
        // Fetch account details from Stripe
        const account = await stripe.accounts.retrieve(location.stripeAccountId);

        console.log(`Account ID: ${account.id}`);
        console.log(`Type: ${account.type}`);
        console.log(`Country: ${account.country}`);
        console.log(`Email: ${account.email || 'Not set'}`);
        console.log(`\nCapabilities:`);
        console.log(`  Charges: ${account.charges_enabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`  Payouts: ${account.payouts_enabled ? '✅ Enabled' : '❌ Disabled'}`);

        // Check requirements
        const hasRequirements =
          account.requirements?.currently_due && account.requirements.currently_due.length > 0;

        if (hasRequirements) {
          console.log(`\n⚠️  Requirements pending:`);
          account.requirements!.currently_due!.forEach((req) => {
            console.log(`     - ${req}`);
          });
        } else {
          console.log(`\n✅ No pending requirements`);
        }

        // Check if account is ready
        const isReady = account.charges_enabled && account.payouts_enabled;

        if (isReady) {
          console.log(`\n🎉 READY FOR ORDERS`);
          summary.ready.push(location.name);
        } else if (hasRequirements) {
          console.log(`\n⏳ Onboarding incomplete`);
          summary.pending.push(location.name);

          // Generate new onboarding link if needed
          if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
            try {
              const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect/refresh`,
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe-connect/success`,
                type: 'account_onboarding',
              });

              console.log(`\n🔗 New onboarding link:`);
              console.log(`   ${accountLink.url}`);
            } catch (linkError) {
              console.log(`   Could not generate new link: ${linkError}`);
            }
          }
        } else {
          console.log(`\n⚠️  Account has issues`);
          summary.issues.push(location.name);
        }

        // Update Sanity with current status
        await sanityClient
          .patch(location._id)
          .set({
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeOnboardingComplete: isReady,
          })
          .commit();

        console.log(`\n💾 Sanity updated with current status`);

      } catch (error: any) {
        console.error(`❌ Error checking account: ${error.message}`);
        summary.issues.push(location.name);
      }
    }

    // Print summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    if (summary.ready.length > 0) {
      console.log(`\n✅ Ready for orders (${summary.ready.length}):`);
      summary.ready.forEach((name) => console.log(`   - ${name}`));
    }

    if (summary.pending.length > 0) {
      console.log(`\n⏳ Onboarding incomplete (${summary.pending.length}):`);
      summary.pending.forEach((name) => console.log(`   - ${name}`));
    }

    if (summary.issues.length > 0) {
      console.log(`\n⚠️  Issues (${summary.issues.length}):`);
      summary.issues.forEach((name) => console.log(`   - ${name}`));
    }

    console.log('');

    if (summary.ready.length === locations.length) {
      console.log('🎉 All locations are ready for online ordering!\n');
    } else {
      console.log('Next steps:');
      console.log('- Complete onboarding for pending locations');
      console.log('- Investigate any accounts with issues');
      console.log('- Run this script again to verify\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
checkAccountStatus();