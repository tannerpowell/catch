import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatItemName(name: string): string {
  let formatted = name;
  formatted = formatted.replace(/Etouffee/g, 'Étouffée');
  formatted = formatted.replace(/etouffee/g, 'étouffée');
  formatted = formatted.replace(/Po Boy/g, "Po' Boy");
  if (formatted === "Side salad") formatted = "Side Salad";
  formatted = formatted.replace(/\bTenders\b/g, 'Chicken Tenders');
  formatted = formatted.replace(/Chicken Chicken Tenders/g, 'Chicken Tenders');
  return formatted;
}

function formatDescription(desc: string): string {
  if (!desc) return desc;
  let formatted = desc;

  // Remove verbose phrases
  formatted = formatted.replace(/Juicy\s+/gi, '');
  formatted = formatted.replace(/\bserved with\b/gi, '&');
  formatted = formatted.replace(/\bof Choice\b/g, '');
  formatted = formatted.replace(/\bof choice\b/g, '');

  // Fix Étouffée
  formatted = formatted.replace(/Etouffee/g, 'Étouffée');
  formatted = formatted.replace(/etouffee/g, 'étouffée');

  // Standardize quantity format: "4 Item" -> "Item (4)"
  // This handles patterns like "4 Boudin Balls" -> "Boudin Balls (4)"
  formatted = formatted.replace(/\b(\d+)\s+(Boudin Balls?|Beignets?|Chicken Tenders?|hush puppies)\b/gi,
    (match, num, item) => `${item} (${num})`);

  // Lowercase generic descriptors
  formatted = formatted.replace(/\bPowdered Sugar\b/g, 'powdered sugar');
  formatted = formatted.replace(/\bside item\b/gi, 'side item');
  formatted = formatted.replace(/\bhush puppies\b/gi, 'hush puppies');

  // Clean up multiple ampersands or spacing issues
  formatted = formatted.replace(/\s*&\s*&\s*/g, ' & ');
  formatted = formatted.replace(/\s+/g, ' ');

  // Handle periods
  const sentences = formatted.split('. ');
  if (sentences.length === 1) formatted = formatted.replace(/\.$/, '');

  // Remove leading commas
  formatted = formatted.replace(/^,\s*/, '');

  // Trim whitespace
  formatted = formatted.trim();

  return formatted;
}

async function importDFWMenu() {
  console.log('Importing DFW menu...\n');

  const menuData = JSON.parse(
    fs.readFileSync(path.resolve('data/dfw-menu-source.json'), 'utf-8')
  );

  const locations = await client.fetch(`
    *[_type == "location" && slug.current in ["denton", "coit-campbell", "garland"]] {
      _id,
      "slug": slug.current,
      name
    }
  `);

  console.log(`Found ${locations.length} DFW locations:\n`);
  locations.forEach((loc: any) => {
    console.log(`  - ${loc.name} (${loc.slug})`);
  });

  const categories = await client.fetch(`
    *[_type == "menuCategory"] {
      _id,
      "slug": slug.current,
      title
    }
  `);

  const categoryMap = new Map(categories.map((c: any) => [c.slug, c]));
  console.log(`\nFound ${categories.length} categories\n`);

  let importedCount = 0;
  let updatedCount = 0;

  for (const section of menuData.menu) {
    const categorySlug = slugify(section.category);
    const category = categoryMap.get(categorySlug);

    if (!category) {
      console.log(`⚠️  Category not found: ${section.category} (${categorySlug})`);
      continue;
    }

    console.log(`\n📁 ${section.category}:`);

    for (const item of section.items) {
      const formattedName = formatItemName(item.name);
      const formattedDescription = formatDescription(item.description || '');
      const itemSlug = slugify(formattedName);

      const existingItems = await client.fetch(`
        *[_type == "menuItem" && name == $name] {
          _id,
          name,
          locationOverrides
        }
      `, { name: formattedName });

      const timestamp = Date.now();
      const locationOverrides: any[] = locations.map((loc: any, idx: number) => ({
        _key: `${loc.slug}-${timestamp}-${idx}`,
        _type: 'locationOverride',
        location: {
          _type: 'reference',
          _ref: loc._id
        },
        price: typeof item.price === 'number' ? item.price : item.price.cup || item.price.bowl,
        available: true
      }));

      if (existingItems.length > 0) {
        const existingItem = existingItems[0];
        const existingOverrides = existingItem.locationOverrides || [];
        const allOverrides = [...existingOverrides, ...locationOverrides];

        await client
          .patch(existingItem._id)
          .set({ locationOverrides: allOverrides })
          .commit();

        console.log(`  ✓ Updated: ${formattedName}`);
        updatedCount++;
      } else {
        const newItem = {
          _type: 'menuItem',
          name: formattedName,
          slug: {
            _type: 'slug',
            current: itemSlug
          },
          category: {
            _type: 'reference',
            _ref: category._id
          },
          description: formattedDescription || undefined,
          basePrice: typeof item.price === 'number' ? item.price : null,
          locationOverrides: locationOverrides
        };

        await client.create(newItem);
        console.log(`  ✅ Created: ${formattedName}`);
        importedCount++;
      }
    }
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`  ✅ Created: ${importedCount} items`);
  console.log(`  ✓ Updated: ${updatedCount} items`);
  console.log(`\n✅ DFW menu import complete!`);
}

importDFWMenu();
