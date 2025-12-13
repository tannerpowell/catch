import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-08-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

interface LocationOverride {
  _key?: string;
  location?: { _ref?: string };
  available?: boolean;
  price?: number;
}

interface MenuItem {
  _id: string;
  name: string;
  source?: string;
  locationOverrides?: LocationOverride[];
}

interface Location {
  _id: string;
  name: string;
}

function countForLocation(items: MenuItem[], locId: string) {
  let count = 0;
  const bySource: Record<string, number> = {};
  for (const item of items) {
    const overrides = item.locationOverrides || [];
    const override = overrides.find(ov => ov.location?._ref === locId);
    const isAvailable = override && override.available !== false;
    if (isAvailable) {
      count++;
      const src = item.source || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    }
  }
  return { count, bySource };
}

async function investigate() {
  // Get all locations
  const locations = await client.fetch<Location[]>(`*[_type == "location"]{_id, name}|order(name)`);
  console.log('All locations:', locations.length);

  // Get all items
  const items = await client.fetch<MenuItem[]>(`
    *[_type == "menuItem" && !(_id in path('drafts.**'))]{
      _id, name, source,
      locationOverrides
    }
  `);

  console.log('Total menu items:', items.length);

  // Count items by source
  const bySource: Record<string, number> = {};
  items.forEach(item => {
    const src = item.source || 'unknown';
    bySource[src] = (bySource[src] || 0) + 1;
  });
  console.log('\nItems by source:');
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
    console.log(`  ${src}: ${count}`);
  });

  console.log('\n=== ITEMS PER LOCATION ===');
  const locationCounts: Array<{name: string; count: number; bySource: Record<string, number>}> = [];

  for (const loc of locations) {
    const data = countForLocation(items, loc._id);
    locationCounts.push({ name: loc.name, ...data });
  }

  // Sort by count descending
  locationCounts.sort((a, b) => b.count - a.count);

  for (const loc of locationCounts) {
    const shortName = loc.name.replace('The Catch — ', '');
    const sources = Object.entries(loc.bySource).map(([k, v]) => `${k}:${v}`).join(', ');
    console.log(`  ${shortName}: ${loc.count} (${sources})`);
  }

  // Check which items at Conroe are NOT at Atascocita (both Houston area)
  console.log('\n=== CONROE vs ATASCOCITA ===');
  const conroeId = 'loc-conroe';
  const atasId = 'loc-atascocita';

  const conroeItems: string[] = [];
  const atasItems: string[] = [];
  const onlyConroe: string[] = [];
  const onlyAtas: string[] = [];

  for (const item of items) {
    const overrides = item.locationOverrides || [];
    const conroeOv = overrides.find(ov => ov.location?._ref === conroeId);
    const atasOv = overrides.find(ov => ov.location?._ref === atasId);

    const atConroe = conroeOv && conroeOv.available !== false;
    const atAtas = atasOv && atasOv.available !== false;

    if (atConroe) conroeItems.push(item.name);
    if (atAtas) atasItems.push(item.name);
    if (atConroe && !atAtas) onlyConroe.push(`${item.name} (${item.source})`);
    if (atAtas && !atConroe) onlyAtas.push(`${item.name} (${item.source})`);
  }

  console.log(`Conroe: ${conroeItems.length} items`);
  console.log(`Atascocita: ${atasItems.length} items`);
  console.log(`\nOnly at Conroe (${onlyConroe.length}):`);
  onlyConroe.slice(0, 20).forEach(n => console.log(`  - ${n}`));
  if (onlyConroe.length > 20) console.log(`  ... and ${onlyConroe.length - 20} more`);

  console.log(`\nOnly at Atascocita (${onlyAtas.length}):`);
  onlyAtas.slice(0, 20).forEach(n => console.log(`  - ${n}`));
  if (onlyAtas.length > 20) console.log(`  ... and ${onlyAtas.length - 20} more`);
}

investigate().catch(console.error);
