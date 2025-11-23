import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function fixGhostKitchens() {
  try {
    console.log('Adding positions to Ghost Kitchen categories...\n');

    // Update Blazing Hen
    const blazingHen = await client.fetch(
      `*[_type == "menuCategory" && slug.current == "blazing-hen"][0]`
    );

    if (blazingHen) {
      await client.patch(blazingHen._id).set({ position: 16 }).commit();
      console.log('✓ Set Blazing Hen position to 16');
    }

    // Update Cajun Creation
    const cajunCreation = await client.fetch(
      `*[_type == "menuCategory" && slug.current == "cajun-creation"][0]`
    );

    if (cajunCreation) {
      await client.patch(cajunCreation._id).set({ position: 17 }).commit();
      console.log('✓ Set Cajun Creation position to 17');
    }

    console.log('\n✅ Ghost Kitchen categories updated!');

    // Show final categories
    const finalCategories = await client.fetch(
      `*[_type == "menuCategory"] | order(position asc) {title, "slug": slug.current, position}`
    );

    console.log('\nFinal categories:');
    finalCategories.forEach((cat: any) => {
      console.log(`  ${cat.position} | ${cat.title}`);
    });

  } catch (error) {
    console.error('Error fixing Ghost Kitchen categories:', error);
  }
}

fixGhostKitchens();
