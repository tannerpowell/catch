/**
 * Migration Script: Add Online Ordering Fields to Existing Locations
 *
 * This script adds default values for new online ordering fields
 * to existing location documents in Sanity.
 *
 * Run with: npx tsx scripts/ecommerce/migrate-locations.ts
 * Or use the npm script: npm run locations:migrate
 */

import { createClient } from '@sanity/client';

/**
 * Ensures required Sanity-related environment variables are present and exits the process if any are missing.
 *
 * Checks for NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN; when either is missing or empty, prints a configuration error
 * with setup instructions and terminates the process with a non-zero exit code.
 */
function validateEnv() {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID.trim() === '') {
    errors.push('NEXT_PUBLIC_SANITY_PROJECT_ID is required but not defined or empty');
  }

  if (!process.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN.trim() === '') {
    errors.push('SANITY_API_TOKEN is required but not defined or empty');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Error: Missing required environment variables\n');
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    console.error('\nRequired setup:');
    console.error('  1. Create a .env.local file in the project root');
    console.error('  2. Add these variables:');
    console.error('     NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id');
    console.error('     SANITY_API_TOKEN=your_api_token');
    console.error('  3. Get these values from https://manage.sanity.io\n');
    process.exit(1);
  }
}

// Run validation before initializing client
validateEnv();

// Initialize Sanity client with validated environment variables
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
  apiVersion: '2024-01-01',
});

interface LocationToMigrate {
  _id: string;
  name: string;
  city: string;
  state: string;
  postalCode: string;
}

// Tax rates by ZIP code (specific location)
// For accuracy, tax rates are looked up by ZIP code first, then fall back to city/state
// This handles local tax variations within states (e.g., different TX cities have different rates)
const TAX_RATES_BY_ZIP: Record<string, number> = {
  // Texas examples - add as needed
  '76201': 0.0825,  // Arlington
  '75043': 0.0825,  // Arlington
  '75248': 0.0825,  // Dallas
  '77001': 0.0825,  // Houston
  '78201': 0.08125, // San Antonio
  '78701': 0.0825,  // Austin
  // Add more ZIP codes as needed
};

// Fallback: Tax rates by city, state (used if ZIP code not found)
const TAX_RATES_BY_CITY: Record<string, number> = {
  'Arlington, TX': 0.0825,
  'Dallas, TX': 0.0825,
  'Houston, TX': 0.0825,
  'San Antonio, TX': 0.08125,
  'Austin, TX': 0.0825,
  'Fort Worth, TX': 0.0825,
  // Add more cities as needed
};

// Final fallback: Tax rates by state (least specific - used only if city not found)
const TAX_RATES_BY_STATE: Record<string, number> = {
  TX: 0.0825,
  // CA: 0.0725,  // California
  // NY: 0.0400,  // New York
  // FL: 0.0600,  // Florida
  // Add other states as needed
};

/**
 * Migrates location documents in Sanity to add online-ordering defaults and assign tax rates.
 *
 * Fetches all locations and for each sets missing online-ordering fields and `taxRate` using a priority
 * lookup: ZIP code → City/State → State. Locations without an applicable tax rate are skipped and
 * recorded; if any locations are skipped the script exits with a non-zero status. Progress is logged
 * per location and a final summary of lookup methods and skipped locations is printed.
 */
async function migrateLocations() {
  console.log('🔄 Starting location migration...\n');
  
  const skippedLocations: Array<{
    name: string;
    city: string;
    state: string;
    postalCode: string;
    reason: string;
  }> = [];

  const failedLocations: Array<{
    name: string;
    city: string;
    state: string;
    postalCode: string;
    reason: string;
  }> = [];
  
  const taxRateLookups: Array<{
    name: string;
    postalCode: string;
    lookupMethod: string;
    rate: number;
  }> = [];

  try {
    // Fetch all existing locations with postal codes
    const locations = await sanityClient.fetch<LocationToMigrate[]>(`
      *[_type == "location"]{
        _id,
        name,
        city,
        state,
        postalCode
      }
    `);

    console.log(`📍 Found ${locations.length} locations to migrate\n`);

    for (const location of locations) {
      console.log(`Migrating: ${location.name} (${location.city}, ${location.state} ${location.postalCode})`);

      try {
        let taxRate: number | undefined;
        let lookupMethod: string = '';

        // Lookup priority: ZIP code → City/State → State → Skip
        
        // 1. Try ZIP code lookup
        if (location.postalCode && location.postalCode in TAX_RATES_BY_ZIP) {
          taxRate = TAX_RATES_BY_ZIP[location.postalCode];
          lookupMethod = `ZIP code ${location.postalCode}`;
        }
        // 2. Try city/state lookup
        else if (`${location.city}, ${location.state}` in TAX_RATES_BY_CITY) {
          taxRate = TAX_RATES_BY_CITY[`${location.city}, ${location.state}`];
          lookupMethod = `City (${location.city}, ${location.state})`;
        }
        // 3. Try state-only lookup
        else if (location.state in TAX_RATES_BY_STATE) {
          taxRate = TAX_RATES_BY_STATE[location.state];
          lookupMethod = `State (${location.state})`;
        }
        
        // 4. No tax rate found - skip this location
        if (taxRate === undefined) {
          const warningMsg = `No tax rate found for ZIP ${location.postalCode}, city ${location.city}, or state ${location.state}`;
          console.warn(
            `  ⚠️  SKIPPED: ${warningMsg}\n` +
            `     Please add one of these to the tax rate maps:\n` +
            `     • TAX_RATES_BY_ZIP['${location.postalCode}'] = 0.XXXX\n` +
            `     • TAX_RATES_BY_CITY['${location.city}, ${location.state}'] = 0.XXXX\n` +
            `     • TAX_RATES_BY_STATE['${location.state}'] = 0.XXXX`
          );
          
          skippedLocations.push({
            name: location.name,
            city: location.city,
            state: location.state,
            postalCode: location.postalCode,
            reason: warningMsg,
          });
          continue;
        }

        await sanityClient
          .patch(location._id)
          .setIfMissing({
            // Online ordering settings - disabled by default
            onlineOrderingEnabled: false,
            acceptingOrders: true,
            orderTypes: ['pickup'],
            minimumOrderAmount: 0,
            deliveryFee: 0,
            taxRate: taxRate,

            // Stripe Connect - all false/empty by default
            stripeOnboardingComplete: false,
            stripeChargesEnabled: false,
            stripePayoutsEnabled: false,
          })
          .commit();

        const ratePercent = (taxRate * 100).toFixed(2);
        console.log(`  ✅ Migrated (tax rate: ${ratePercent}% via ${lookupMethod})`);
        
        taxRateLookups.push({
          name: location.name,
          postalCode: location.postalCode,
          lookupMethod,
          rate: taxRate,
        });

      } catch (error) {
        console.error(`  ❌ Error migrating ${location.name}:`, error);
        failedLocations.push({
          name: location.name,
          city: location.city,
          state: location.state,
          postalCode: location.postalCode,
          reason: `Patch error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Tax Rate Lookup Summary:\n');
    
    // Group by lookup method
    const byMethod: Record<string, number> = {};
    for (const lookup of taxRateLookups) {
      byMethod[lookup.lookupMethod] = (byMethod[lookup.lookupMethod] || 0) + 1;
    }
    
    for (const [method, count] of Object.entries(byMethod)) {
      console.log(`  ${count} location(s) using ${method}`);
    }
    
    if (skippedLocations.length > 0) {
      console.log(`\n⚠️  SKIPPED ${skippedLocations.length} location(s) - Missing Tax Rates:\n`);
      for (const loc of skippedLocations) {
        console.log(`  • ${loc.name} (${loc.city}, ${loc.state} ${loc.postalCode})`);
      }
      console.log(
        `\n📝 ACTION REQUIRED:\n` +
        `   Add tax rates for these locations. Preferred order:\n` +
        `   1. Add ZIP code to TAX_RATES_BY_ZIP (most accurate)\n` +
        `   2. Add city/state to TAX_RATES_BY_CITY (less specific)\n` +
        `   3. Add state to TAX_RATES_BY_STATE (least specific)\n`
      );
    }

    if (failedLocations.length > 0) {
      console.log(`\n❌ ${failedLocations.length} location(s) failed during migration:\n`);
      for (const loc of failedLocations) {
        console.log(`  • ${loc.name} (${loc.city}, ${loc.state} ${loc.postalCode}) - ${loc.reason}`);
      }
    }

    const successCount = locations.length - skippedLocations.length - failedLocations.length;
    console.log(`\n${successCount}/${locations.length} locations migrated successfully`);
    
    if (skippedLocations.length === 0 && failedLocations.length === 0) {
      console.log('\n✅ Migration complete!');
      console.log('\nNext steps:');
      console.log('1. Review tax rates in Sanity Studio for each location');
      console.log('2. Add email addresses for location managers');
      console.log('3. Run setup-stripe-locations.ts to create Stripe accounts');
      console.log('4. Enable onlineOrderingEnabled for locations when ready\n');
    } else {
      console.log('\n❌ Migration incomplete - please fix missing tax rates and retry\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
migrateLocations();