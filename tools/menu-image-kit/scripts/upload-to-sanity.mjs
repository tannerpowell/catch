#!/usr/bin/env node

/**
 * Upload Option 5 enhanced images to Sanity
 * Replaces existing menu item images with Gemini-enhanced versions
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'cwo08xml';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_WRITE_TOKEN;

const IMAGE_DIR = './data/option5-jpeg';

// Manual slug mappings for mismatched names
const SLUG_MAP = {
  'big-bang-shrimp': 'bang-bang-shrimp',
  'chicken-and-waffles': 'chicken-waffles',
  'warm-beignets': 'warm-beignets-4',
  'jumbo-shrimp-and-catfish': 'jumbo-shrimp-4-catfish-2-combo',
};

// Files with descriptive names that map to specific items
const DESCRIPTIVE_MAP = {
  'Blackened Catfish with sides': 'cajun-special',
  'Bourbon chicken pasta with a piece of toast': 'bourbon-chicken-pasta',
  'Catfish basket, served': 'catfish-basket',
  'Chicken and waffles with dipp, top view': 'chicken-waffles',
  'French Quarter Plate': 'french-quarter-plate',
  'Hush puppies with dipping sauce': 'hush-puppies',
  'Shrimp Etouffee Quesadilla': 'shrimp-etouffee-quesadilla',
  'Shrimp and rice topped with a sauce with o vegetables and toast': 'shrimp-etouffee',
  'The Big Easy, seafoof dish': 'the-big-easy',
  'The Catch Boil, sea food plater': 'the-catch-boil',
};

// Skip these files (generic/duplicate or no clear mapping)
const SKIP_FILES = [
  'Different menu items served on the table, top view',
  'Fish fillets served on rice, with a side of french fries and a slice of toasted bread',
  'Fish tacos with a dipping sauce and tater tots on the side',
  'Fried fish with fries and toast, top view',
  'menu-item-',
  'menu-item-(1)',
  'menu-item-(2)',
  'menu-item-(3)',
  'menu-item-(4)',
  'menu-item-(5)',
  'menu-item-(6)',
  'menu-item-(7)',
  'menu-item-(8)',
  'menu-item-(10)',
  'menu-item-(11)',
  'menu-item-(12)',
  'menu-item-(13)',
];

async function main() {
  if (!TOKEN) {
    console.error('SANITY_WRITE_TOKEN required. Run: source /Users/tp/Projects/Catch/.env.local');
    process.exit(1);
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    token: TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  // Get all square images (1x1 is what Sanity currently uses for menu items)
  const files = fs.readdirSync(IMAGE_DIR)
    .filter(f => f.endsWith('__square_1x1.jpg'));

  console.log(`Found ${files.length} square images to process\n`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const baseName = file.replace('__square_1x1.jpg', '');

    // Check if should skip
    if (SKIP_FILES.includes(baseName)) {
      console.log(`SKIP: ${baseName} (no clear mapping)`);
      skipped++;
      continue;
    }

    // Determine the Sanity slug
    let slug = DESCRIPTIVE_MAP[baseName] || SLUG_MAP[baseName] || baseName;

    // Try to find the menu item
    const query = `*[_type == "menuItem" && slug.current == $slug][0]{_id, name}`;
    const item = await client.fetch(query, { slug });

    if (!item) {
      console.log(`SKIP: ${baseName} → slug "${slug}" not found in Sanity`);
      skipped++;
      continue;
    }

    try {
      // Upload the image
      const imagePath = path.join(IMAGE_DIR, file);
      const imageBuffer = fs.readFileSync(imagePath);

      const asset = await client.assets.upload('image', imageBuffer, {
        filename: file,
        contentType: 'image/jpeg',
      });

      // Update the menu item with the new image
      await client.patch(item._id)
        .set({
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`OK: ${item.name} ← ${file}`);
      uploaded++;
    } catch (err) {
      console.error(`ERROR: ${item.name} - ${err.message}`);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n=== Done ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
