/**
 * Add the 3 DFW locations to Sanity CMS.
 * Data from: /Users/tp/Projects/Catch/data/the catch dfw/the-catch-data.json
 * and /Users/tp/Projects/Catch/data/Locations.csv
 */
import { getSanityClient } from '../lib/sanity-config';
import path from 'path';

const client = getSanityClient('2025-11-22');

const DFW_LOCATIONS = [
  {
    _id: "loc-denton",
    slug: "denton",
    storeId: 72,
    name: "The Catch — Denton",
    addressLine1: "1725 W University Dr",
    city: "Denton",
    state: "TX",
    postalCode: "76201",
    phone: "+1 940-435-0161",
    hours: {
      sunday: "10:30 AM–9:00 PM",
      monday: "10:30 AM–9:00 PM",
      tuesday: "10:30 AM–9:00 PM",
      wednesday: "10:30 AM–9:00 PM",
      thursday: "10:30 AM–9:00 PM",
      friday: "10:30 AM–10:00 PM",
      saturday: "10:30 AM–10:00 PM",
    },
  },
  {
    _id: "loc-garland",
    slug: "garland",
    storeId: 4,
    name: "The Catch — Garland",
    addressLine1: "5949 Broadway Blvd",
    addressLine2: "Ste 110",
    city: "Garland",
    state: "TX",
    postalCode: "75043",
    phone: "+1 469-443-0033",
    hours: {
      sunday: "10:30 AM–9:00 PM",
      monday: "10:30 AM–9:00 PM",
      tuesday: "10:30 AM–9:00 PM",
      wednesday: "10:30 AM–9:00 PM",
      thursday: "10:30 AM–9:00 PM",
      friday: "10:30 AM–10:00 PM",
      saturday: "10:30 AM–10:00 PM",
    },
  },
  {
    _id: "loc-coit-campbell",
    slug: "coit-campbell",
    storeId: 110,
    name: "The Catch — Coit & Campbell",
    addressLine1: "7522 Campbell Rd",
    addressLine2: "Ste 108",
    city: "Dallas",
    state: "TX",
    postalCode: "75248",
    phone: "+1 214-484-1941",
    hours: {
      sunday: "10:30 AM–9:00 PM",
      monday: "10:30 AM–9:00 PM",
      tuesday: "10:30 AM–9:00 PM",
      wednesday: "10:30 AM–9:00 PM",
      thursday: "10:30 AM–9:00 PM",
      friday: "10:30 AM–10:00 PM",
      saturday: "10:30 AM–10:00 PM",
    },
  },
];

async function main() {
  console.log("Adding 3 DFW locations to Sanity...\n");

  const transaction = client.transaction();

  for (const location of DFW_LOCATIONS) {
    console.log(`Creating location: ${location.name} (${location.slug})`);

    const { slug, ...rest } = location;
    transaction.createOrReplace({
      ...rest,
      _type: "location",
      slug: { _type: "slug", current: slug },
    } as any);
  }

  await transaction.commit();

  console.log("\n✅ Successfully added all 3 DFW locations to Sanity!");

  // Verify
  const locations = await client.fetch(
    `*[_type == "location"] | order(name asc) { _id, slug, name, storeId }`
  );

  console.log(`\nTotal locations in Sanity: ${locations.length}`);
  locations.forEach((loc: any) => {
    console.log(`  - ${loc.slug.current}: ${loc.name} (storeId: ${loc.storeId || 'none'})`);
  });
}

main().catch(console.error);
