import { getSanityClient } from '../lib/sanity-config';

const client = getSanityClient('2024-01-01');

async function checkFriedMushrooms() {
  const items = await client.fetch(`
    *[_type == "menuItem" && name match "*Fried Mushrooms*"] {
      _id,
      name,
      slug,
      image,
      category->{title, slug}
    }
  `);

  console.log(`Found ${items.length} Fried Mushrooms items:\n`);
  items.forEach((item: any, i: number) => {
    console.log(`${i + 1}. ID: ${item._id}`);
    console.log(`   Name: ${item.name}`);
    console.log(`   Slug: ${item.slug?.current || 'NO SLUG'}`);
    console.log(`   Image: ${item.image || 'NO IMAGE'}`);
    console.log(`   Category: ${item.category?.title || 'NO CATEGORY'}`);
    console.log('');
  });
}

checkFriedMushrooms();
