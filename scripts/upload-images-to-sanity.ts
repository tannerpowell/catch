/**
 * Upload compressed images to Sanity Media Library
 *
 * Run with: npx tsx scripts/upload-images-to-sanity.ts
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { SANITY_API_VERSION, withTimeout } from '../lib/sanity/constants';

// Require environment variables - no hardcoded fallbacks to prevent accidental uploads
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SANITY_PROJECT_ID');
  console.error('  NEXT_PUBLIC_SANITY_DATASET');
  console.error('\nSet these in .env.local or export them before running.');
  process.exit(1);
}

if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN environment variable.');
  console.error('Create a token with "create" permissions at https://manage.sanity.io');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: SANITY_API_VERSION,
  token,
  useCdn: false,
});

// Longer timeout for uploads (30s) since images can be large
const UPLOAD_TIMEOUT = 30000;

interface UploadResult {
  filename: string;
  sanityUrl: string;
  assetId: string;
}

async function uploadImage(filePath: string): Promise<UploadResult> {
  const filename = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);

  console.log(`  Uploading: ${filename}...`);

  const asset = await withTimeout(
    client.assets.upload('image', buffer, {
      filename,
      contentType: 'image/jpeg',
    }),
    UPLOAD_TIMEOUT
  );

  return {
    filename,
    sanityUrl: asset.url,
    assetId: asset._id,
  };
}

async function main() {
  const jpegDir = path.resolve('public/images/jpeg');

  if (!fs.existsSync(jpegDir)) {
    console.error('JPEG directory not found. Run compress-images.sh first.');
    process.exit(1);
  }

  const files = fs.readdirSync(jpegDir)
    .filter(f => f.endsWith('.jpg'))
    .map(f => path.join(jpegDir, f));

  console.log(`Found ${files.length} images to upload\n`);

  const results: UploadResult[] = [];

  for (const file of files) {
    try {
      const result = await uploadImage(file);
      results.push(result);
      console.log(`    ✓ ${result.sanityUrl}`);
    } catch (error) {
      console.error(`    ✗ Failed to upload ${path.basename(file)}:`, error);
    }
  }

  console.log(`\n✅ Uploaded ${results.length}/${files.length} images\n`);

  // Generate mapping for use in code
  console.log('// Image URL mapping (copy to update page.tsx):');
  console.log('const SANITY_IMAGES: Record<string, string> = {');
  for (const r of results) {
    // Convert filename to a key that matches the original naming
    const key = r.filename.replace('.jpg', '.png');
    console.log(`  '${key}': '${r.sanityUrl}',`);
  }
  console.log('};');

  // Save mapping to file for reference
  const mapping = results.reduce((acc, r) => {
    const key = r.filename.replace('.jpg', '.png');
    acc[key] = r.sanityUrl;
    return acc;
  }, {} as Record<string, string>);

  fs.writeFileSync(
    'scripts/sanity-image-mapping.json',
    JSON.stringify(mapping, null, 2)
  );
  console.log('\n📄 Mapping saved to scripts/sanity-image-mapping.json');
}

main().catch(console.error);
