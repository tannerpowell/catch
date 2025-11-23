import { getSanityClient } from '../lib/sanity-config';

const client = getSanityClient('2024-01-01');

async function checkMushroomsAvailability() {
  // Check the remaining item
  const remaining = await client.fetch(`
    *[_type == "menuItem" && name match "*Fried Mushrooms*"][0] {
      _id,
      name,
      locationOverrides,
      price,
      available
    }
  `);

  console.log('Remaining Fried Mushrooms item:\n');
  console.log(`ID: ${remaining._id}`);
  console.log(`Name: ${remaining.name}`);
  console.log(`Base Price: ${remaining.price}`);
  console.log(`Available: ${remaining.available !== false ? 'Yes' : 'No'}`);
  console.log('\nLocation Overrides:');

  if (remaining.locationOverrides && Object.keys(remaining.locationOverrides).length > 0) {
    Object.entries(remaining.locationOverrides).forEach(([location, data]: [string, any]) => {
      console.log(`  ${location}:`);
      console.log(`    Available: ${data.available !== false ? 'Yes' : 'No'}`);
      if (data.price !== undefined) console.log(`    Price: $${data.price}`);
    });
  } else {
    console.log('  No location overrides - available at ALL locations');
  }

  // Also check all locations to see which should have mushrooms
  const locations = await client.fetch(`
    *[_type == "location"] {
      _id,
      name,
      slug
    }
  `);

  console.log('\n\nAll Locations:');
  locations.forEach((loc: any) => {
    console.log(`  - ${loc.name} (${loc.slug.current})`);
  });
}

checkMushroomsAvailability();
