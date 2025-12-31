#!/usr/bin/env node

/**
 * Generate menu images from text descriptions using Gemini
 * Uses reference images from successfully processed items for consistency
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Configuration
const MODEL = "gemini-3-pro-image-preview"; // Same model as batch-menu-photos.mjs
const OUTPUT_DIR = "./data/generated";
const BATCH_GROUPS_FILE = "./data/batch-groups.json";
const REFERENCE_DIR = "./data/option5-jpeg";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CONCURRENCY = 1; // Reserved for future parallel processing
const RATE_LIMIT_DELAY = parseInt(process.env.RATE_LIMIT_DELAY || "8000");
const IMAGE_SIZE = "2K";

// Base prompt for consistent styling
const BASE_STYLE = `
Create a professional menu photo for an upscale casual seafood restaurant:
- Reclaimed wood table surface with natural grain and warm brown tones
- Soft natural daylight from a window, creating gentle shadows
- Bright but not harsh - like a sunny afternoon in a waterfront restaurant
- Modern white ceramic plates or bowls, simple clean design
- Photorealistic, appetizing presentation with natural colors
- Centered, slightly angled view with full dish in frame
- No candles, no marble, no utensils, no napkins, no text, no watermarks
`;

async function loadReferenceImage(refPath) {
  if (!refPath || !fs.existsSync(refPath)) return null;

  const data = fs.readFileSync(refPath);
  const ext = path.extname(refPath).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
}

function buildPrompt(item, category) {
  const itemDesc = item.description ? ` - ${item.description}` : '';

  // Category-specific styling hints
  const categoryHints = {
    shrimp: 'Gulf shrimp, golden fried or boiled in Cajun seasoning, visible tail-on shrimp',
    catfish: 'Southern fried catfish fillets, golden brown crispy breading, flaky white fish visible',
    chicken: 'Crispy fried chicken tenders, golden brown breading, juicy interior',
    crab: 'Snow crab legs, red-orange shells, served with melted butter',
    oyster: 'Fried Gulf oysters, golden crispy coating, plump and appetizing',
    crawfish: 'Louisiana crawfish tails, bright red, Cajun seasoned',
    gator: 'Fried alligator bites, golden nuggets similar to chicken',
    combo: 'Seafood combo platter with multiple proteins arranged attractively',
    poboy: "New Orleans po' boy sandwich on French bread, generous filling visible",
    sides: 'Southern side dish, comfort food styling',
    soups: 'Louisiana soup or stew in a bowl, steam rising, rich color',
    desserts: 'Southern dessert, dusted with powdered sugar if applicable',
    sauces: 'Dipping sauce in small ramekin, glossy and appetizing'
  };

  return `${BASE_STYLE}

Dish: ${item.name}${itemDesc}
Style: ${categoryHints[category] || 'Southern Cajun seafood restaurant dish'}

Generate a photorealistic menu image of this exact dish.`;
}

async function generateImage(ai, item, category, refImage) {
  const prompt = buildPrompt(item, category);

  const contents = refImage
    ? [
        { text: "Use this reference image for styling consistency:" },
        refImage,
        { text: prompt }
      ]
    : [{ text: prompt }];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: contents }],
    config: {
      imageConfig: {
        aspectRatio: "4:3",
        imageSize: IMAGE_SIZE
      }
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('No image in response');
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  // Load batch groups
  if (!fs.existsSync(BATCH_GROUPS_FILE)) {
    console.error('Run categorize-items.mjs first to create batch-groups.json');
    process.exit(1);
  }

  const batchGroups = JSON.parse(fs.readFileSync(BATCH_GROUPS_FILE, 'utf8'));

  // Filter to specific category if provided
  const targetCategory = process.argv[2];
  const groups = targetCategory
    ? batchGroups.filter(g => g.category === targetCategory)
    : batchGroups;

  if (groups.length === 0) {
    console.error(`No groups found${targetCategory ? ` for category: ${targetCategory}` : ''}`);
    console.log('Available categories:', batchGroups.map(g => g.category).join(', '));
    process.exit(1);
  }

  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  let processed = 0;
  let errors = 0;

  console.log(`\nGenerating ${totalItems} images across ${groups.length} categories`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Rate limit delay: ${RATE_LIMIT_DELAY}ms\n`);

  for (const group of groups) {
    console.log(`\n=== ${group.category.toUpperCase()} (${group.items.length} items) ===`);

    // Load reference image for this category
    const refPath = group.referenceImage
      ? path.join(REFERENCE_DIR, group.referenceImage)
      : null;
    const refImage = await loadReferenceImage(refPath);

    if (refPath && !refImage) {
      console.log(`  Warning: Reference image not found: ${refPath}`);
    }

    for (const item of group.items) {
      const slug = slugify(item.name);
      const outPath = path.join(OUTPUT_DIR, `${slug}__hero_4x3.jpg`);

      // Skip if already exists
      if (fs.existsSync(outPath)) {
        console.log(`  SKIP: ${item.name} (exists)`);
        processed++;
        continue;
      }

      try {
        console.log(`  Generating: ${item.name}...`);
        const imageData = await generateImage(ai, item, group.category, refImage);
        fs.writeFileSync(outPath, imageData);
        console.log(`  OK: ${item.name}`);
        processed++;
      } catch (err) {
        console.error(`  ERROR: ${item.name} - ${err.message}`);
        errors++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Processed: ${processed}/${totalItems}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
