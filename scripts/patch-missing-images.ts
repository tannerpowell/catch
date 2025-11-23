import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { createClient } from "@sanity/client";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error("Missing Sanity env vars");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-11-22",
  token,
  useCdn: false
});

const productsPath = path.resolve(process.cwd(), "revel-products.json");
if (!fs.existsSync(productsPath)) {
  throw new Error("revel-products.json not found. Run scripts/scrape-revel.ts first.");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const productsData = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const items: Array<{
    category: string;
    name: string;
    slug: string;
    image?: string | null;
  }> = [];

  for (const category of productsData.categories) {
    for (const item of category.items) {
      if (item.image) {
        items.push({
          category: category.category,
          name: item.name,
          slug: slugify(item.name),
          image: item.image
        });
      }
    }
  }

  const missingDocs: Array<{
    _id: string;
    name: string;
    slug: string;
  }> = await client.fetch(
    `*[_type == "menuItem" && !defined(image.asset._ref)]{ _id, name, "slug": slug.current }`
  );

  console.log(`Found ${missingDocs.length} menu items missing images in Sanity.`);

  const productMap = new Map<string, { category: string; name: string; image: string }>();
  for (const item of items) {
    productMap.set(item.slug, { category: item.category, name: item.name, image: item.image! });
  }

  let patched = 0;

  for (const doc of missingDocs) {
    const match = productMap.get(doc.slug);
    if (!match) {
      console.log(`No Revel image for slug ${doc.slug}`);
      continue;
    }

    try {
      const res = await fetch(match.image);
      if (!res.ok) {
        console.warn("Failed to download", doc.slug, res.statusText);
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const jpeg = await sharp(buffer).jpeg({ quality: 80 }).toBuffer();
      const filename = `${slugify(match.category)}-${doc.slug}.jpg`;
      const asset = await client.assets.upload("image", jpeg, {
        filename,
        contentType: "image/jpeg"
      });
      await client
        .patch(doc._id)
        .set({ image: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
        .commit();
      patched += 1;
      console.log(`Patched ${doc.slug} with Revel image`);
    } catch (err: any) {
      console.error("Error patching", doc.slug, err.message || err);
    }
  }

  console.log(`Done. Patched ${patched}/${missingDocs.length} items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
