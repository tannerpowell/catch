/**
 * Add new Oklahoma and Texas locations to Sanity CMS.
 * Data sourced from: https://www.thecatchseafood.com/locations
 *
 * NOTE: storeIds are placeholders and need to be updated with actual Revel/POS IDs
 */
import { getSanityClient } from '../lib/sanity-config';
import { fallbackGeoCoordinates } from '../lib/adapters/sanity-catch';

const client = getSanityClient('2025-11-22');

// Sanity location document type
interface SanityLocationDocument {
  _id: string;
  _type: 'location';
  name: string;
  slug: { _type: 'slug'; current: string };
  storeId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  hours?: Record<string, string>;
  menuUrl?: string;
  revelEstablishmentId?: string;
  geo?: { _type: 'geopoint'; lat: number; lng: number };
  onlineOrderingEnabled: boolean;
  acceptingOrders: boolean;
  orderTypes: string[];
}

// Standard hours for most locations
const standardHours = {
  sunday: "11:00 AM–9:00 PM",
  monday: "11:00 AM–9:00 PM",
  tuesday: "11:00 AM–9:00 PM",
  wednesday: "11:00 AM–9:00 PM",
  thursday: "11:00 AM–9:00 PM",
  friday: "11:00 AM–10:00 PM",
  saturday: "11:00 AM–10:00 PM",
};

const NEW_LOCATIONS = [
  // === OKLAHOMA LOCATIONS ===
  {
    _id: "loc-okc-memorial",
    slug: "okc-memorial",
    storeId: 201, // Placeholder - update with actual SkyTab/POS ID
    name: "The Catch — OKC Memorial",
    addressLine1: "2127 West Memorial Rd",
    city: "Oklahoma City",
    state: "OK",
    postalCode: "73134",
    phone: "+1 405-849-4300",
    hours: standardHours,
    menuUrl: "https://online.skytab.com/798f4bdcca1a4bbc3094e4d9047298a1",
  },
  {
    _id: "loc-midwest-city",
    slug: "midwest-city",
    storeId: 202, // Placeholder - update with actual SkyTab/POS ID
    name: "The Catch — Midwest City",
    addressLine1: "2320 South Air Depot Blvd",
    city: "Midwest City",
    state: "OK",
    postalCode: "73110",
    phone: "+1 405-931-3826",
    hours: standardHours,
    menuUrl: "https://online.skytab.com/81faf49003f136c797ff9a2b8f2a6d0b",
  },
  {
    _id: "loc-moore",
    slug: "moore",
    storeId: 203, // Placeholder - update with actual SkyTab/POS ID
    name: "The Catch — Moore",
    addressLine1: "1301 South I-35 Service Rd",
    city: "Moore",
    state: "OK",
    postalCode: "73160",
    phone: "+1 405-735-5559",
    hours: standardHours,
    menuUrl: "https://online.skytab.com/9598806413d1b7d219bf3122b16afa8e",
  },

  // === TEXAS LOCATIONS ===
  {
    _id: "loc-arlington",
    slug: "arlington",
    storeId: 204, // Placeholder - update with actual POS ID
    name: "The Catch — Arlington",
    addressLine1: "5809 West I-20",
    city: "Arlington",
    state: "TX",
    postalCode: "76017",
    phone: "+1 817-765-2226",
    hours: standardHours,
    // menuUrl not yet available for Google Food ordering
  },
  {
    _id: "loc-burleson",
    slug: "burleson",
    storeId: 205, // Placeholder - update with actual POS ID
    name: "The Catch — Burleson",
    addressLine1: "1505 SW Wilshire Blvd",
    addressLine2: "STE 610",
    city: "Burleson",
    state: "TX",
    postalCode: "76028",
    phone: "+1 817-447-4302",
    hours: standardHours,
    // menuUrl not yet available for Google Food ordering
  },
  {
    _id: "loc-longview",
    slug: "longview",
    storeId: 206, // Placeholder - update with actual POS ID
    name: "The Catch — Longview",
    addressLine1: "3312 North 4th St",
    city: "Longview",
    state: "TX",
    postalCode: "75605",
    phone: "+1 903-600-3115",
    hours: standardHours,
    menuUrl: "https://www.thecatchtx.com/order?l=en-US#/restaurant/14294/collection/15745",
  },
  {
    _id: "loc-lubbock",
    slug: "lubbock",
    storeId: 1, // From Revel URL: thecatchseafood.revelup.online/store/1
    name: "The Catch — Lubbock",
    addressLine1: "5111 82nd St",
    city: "Lubbock",
    state: "TX",
    postalCode: "79424",
    phone: "+1 806-701-2900",
    hours: standardHours,
    menuUrl: "https://thecatchseafood.revelup.online/store/1/category/1/subcategory/2",
    revelEstablishmentId: "1",
  },
  {
    _id: "loc-tyler",
    slug: "tyler",
    storeId: 207, // Placeholder - update with actual POS ID
    name: "The Catch — Tyler",
    addressLine1: "1714 South Beckham Ave",
    city: "Tyler",
    state: "TX",
    postalCode: "75701",
    phone: "+1 903-500-7514",
    hours: standardHours,
    menuUrl: "https://www.thecatchtx.com/order?l=en-US#/restaurant/14294/collection/15639",
  },
  {
    _id: "loc-wichita-falls",
    slug: "wichita-falls",
    storeId: 3, // From Revel URL: thecatchseafood.revelup.online/store/3
    name: "The Catch — Wichita Falls",
    addressLine1: "4004 Kemp Blvd",
    city: "Wichita Falls",
    state: "TX",
    postalCode: "76308",
    phone: "+1 940-228-7864",
    hours: standardHours,
    menuUrl: "https://thecatchseafood.revelup.online/store/3/category/402/subcategory/403",
    revelEstablishmentId: "3",
  },
];

async function main() {
  console.log(`Adding ${NEW_LOCATIONS.length} new locations to Sanity...\n`);

  const transaction = client.transaction();

  for (const location of NEW_LOCATIONS) {
    const { slug, ...rest } = location;
    const geo = fallbackGeoCoordinates[slug];

    console.log(`Creating location: ${location.name} (${slug})`);
    if (geo) {
      console.log(`  └─ Geo: ${geo.lat}, ${geo.lng}`);
    }

    transaction.createOrReplace({
      ...rest,
      _type: "location",
      slug: { _type: "slug", current: slug },
      // Add geo coordinates if available
      ...(geo && {
        geo: {
          _type: "geopoint",
          lat: geo.lat,
          lng: geo.lng,
        },
      }),
      // Default settings
      onlineOrderingEnabled: false,
      acceptingOrders: true,
      orderTypes: ["pickup"],
    } satisfies SanityLocationDocument);
  }

  await transaction.commit();

  console.log(`\n✅ Successfully added ${NEW_LOCATIONS.length} locations to Sanity!`);

  // Verify
  const locations = await client.fetch(
    `*[_type == "location"] | order(state asc, name asc) { _id, "slug": slug.current, name, city, state, storeId }`
  );

  console.log(`\nTotal locations in Sanity: ${locations.length}`);

  let currentState = "";
  locations.forEach((loc: any) => {
    if (loc.state !== currentState) {
      currentState = loc.state;
      console.log(`\n${currentState}:`);
    }
    console.log(`  - ${loc.slug}: ${loc.name} (storeId: ${loc.storeId || 'none'})`);
  });

  console.log("\n⚠️  NOTE: Some storeIds are placeholders (201-207). Update with actual POS IDs!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
