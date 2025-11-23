import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2025-11-22',
  useCdn: false,
});

// Mapping of image filenames to menu item slugs
const imageMap: Record<string, string> = {
  'banana-pudding.jpeg': 'banana-pudding',
  'big-bang-shrimp.jpeg': 'bang-bang-shrimp',
  'bourbon-chicken-pasta.jpeg': 'bourbon-chicken-pasta',
  'cajun-special.jpeg': 'cajun-special',
  'catfish-basket.jpeg': 'catfish-basket',
  'chicken-and-waffles.jpeg': 'chicken-waffles',
  'french-quarter-plate.jpeg': 'french-quarter-plate',
  'gumbo.jpeg': 'gumbo',
  'house-salad.jpeg': 'house-salad',
  'hush-puppies.jpeg': 'hush-puppies',
  'jumbo-shrimp-and-catfish.jpeg': 'jumbo-shrimp-4-catfish-2-combo',
  'key-lime-pie.jpeg': 'key-lime-pie',
  'shrimp-etouffee-quesadilla.jpeg': 'shrimp-etouffee-quesadilla',
  'swamp-fries.jpeg': 'swamp-fries',
  'the-big-easy.jpeg': 'the-big-easy',
  'the-catch-boil.jpeg': 'the-catch-boil',
  'warm-beignets.jpeg': 'warm-beignets-4',
};

async function uploadImage(imagePath: string): Promise<string> {
  const imageBuffer = fs.readFileSync(imagePath);
  const filename = path.basename(imagePath);

  const asset = await client.assets.upload('image', imageBuffer, {
    filename: filename,
  });

  return asset._id;
}

async function matchDFWPhotos() {
  console.log('Matching DFW photos to menu items...\n');

  const imagesDir = path.resolve('public/dfw-images');
  let matchedCount = 0;
  let notFoundCount = 0;
  const notFoundSlugs: string[] = [];

  for (const [filename, slug] of Object.entries(imageMap)) {
    const imagePath = path.join(imagesDir, filename);

    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Image file not found: ${filename}`);
      continue;
    }

    // Find menu item by slug
    const items = await client.fetch(`
      *[_type == "menuItem" && slug.current == $slug] {
        _id,
        name,
        "slug": slug.current,
        image
      }
    `, { slug });

    if (items.length === 0) {
      console.log(`⚠️  Menu item not found for slug: ${slug} (${filename})`);
      notFoundSlugs.push(slug);
      notFoundCount++;
      continue;
    }

    const item = items[0];

    // Check if item already has an image
    if (item.image) {
      console.log(`  ⏭  Skipping ${item.name} - already has image`);
      continue;
    }

    try {
      // Upload image to Sanity
      console.log(`  📸 Uploading ${filename} for ${item.name}...`);
      const assetId = await uploadImage(imagePath);

      // Update menu item with image reference
      try {
        await client
          .patch(item._id)
          .set({
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: assetId,
              },
            },
          })
          .commit();

        console.log(`  ✅ Matched ${item.name}`);
        matchedCount++;
      } catch (patchError) {
        // Patch failed - delete the uploaded asset to prevent orphaned assets
        console.error(`  ❌ Failed to patch menu item ${item.name}:`, patchError instanceof Error ? patchError.message : String(patchError));
        
        try {
          console.log(`  🧹 Cleaning up orphaned asset...`);
          await client.assets.delete(assetId);
          console.log(`  ✓ Asset cleanup successful`);
        } catch (deleteError) {
          console.error(`  ❌ Failed to delete orphaned asset ${assetId}:`, deleteError instanceof Error ? deleteError.message : String(deleteError));
        }
      }
    } catch (uploadError) {
      // Upload failed - no asset to clean up
      console.error(`  ❌ Failed to upload ${filename} for ${item.name}:`, uploadError instanceof Error ? uploadError.message : String(uploadError));
    }
  }

  console.log(`\n\n📊 Photo Matching Summary:`);
  console.log(`  ✅ Matched: ${matchedCount} photos`);
  console.log(`  ⚠️  Not found: ${notFoundCount} menu items`);

  if (notFoundSlugs.length > 0) {
    console.log(`\n  Menu items not found:`);
    notFoundSlugs.forEach(slug => console.log(`    - ${slug}`));
  }

  console.log(`\n✅ DFW photo matching complete!`);
}

matchDFWPhotos();
