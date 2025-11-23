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

async function checkIssues() {
  try {
    const items = await client.fetch(`
      *[_type == "menuItem" && description != null] {
        _id,
        name,
        description
      }
    `);

    console.log('Checking for remaining patterns...\n');

    // Check for "fried Oysters" pattern (should be "Fried Oysters" when standalone)
    const lowerFriedOysters = items.filter((item: any) =>
      item.description && /\bfried Oysters\b/.test(item.description)
    );

    console.log(`Found ${lowerFriedOysters.length} items with "fried Oysters" pattern:\n`);
    lowerFriedOysters.slice(0, 10).forEach((item: any) => {
      console.log(`${item.name}: ${item.description}`);
      console.log('---');
    });

    // Check for cooking methods before items
    const cookingBeforeItem = items.filter((item: any) =>
      item.description && /\b(fried|grilled|blackened),?\s+(fried|grilled|blackened)\s+or\s+(fried|grilled|blackened)\s+(Oysters?|Catfish|Whitefish)\b/i.test(item.description)
    );

    console.log(`\nFound ${cookingBeforeItem.length} items with cooking methods before item:\n`);
    cookingBeforeItem.slice(0, 5).forEach((item: any) => {
      console.log(`${item.name}: ${item.description}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking issues:', error);
  }
}

checkIssues();
