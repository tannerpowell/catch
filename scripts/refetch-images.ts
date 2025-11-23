import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";
import sharp from "sharp";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error("Missing required env vars (NEXT_PUBLIC_SANITY_* or SANITY_WRITE_TOKEN)");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-10-01",
  token,
  useCdn: false
});

function makeFileName(section: string | undefined, slug: string) {
  const parts = [] as string[];
  if (section) parts.push(section.toLowerCase());
  parts.push(slug.toLowerCase());
  const joined = parts.join("-");
  return joined.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "") || "menu-item";
}

async function run() {
  const docs: Array<{
    _id: string;
    name: string;
    slug: string;
    categorySlug?: string;
    asset?: { _id: string; url: string } | null;
  }> = await client.fetch(
    `*[_type=="menuItem" && defined(image.asset._ref)]{
      _id,
      name,
      "slug": slug.current,
      "categorySlug": category->slug.current,
      "asset": image.asset->{_id, url}
    }`
  );

  console.log(`Found ${docs.length} menu items with images`);

  for (const doc of docs) {
    if (!doc.asset?.url) {
      console.warn("Skipping (no asset url)", doc.slug);
      continue;
    }
    const filenameRoot = makeFileName(doc.categorySlug, doc.slug);
    const filename = `${filenameRoot}.jpg`;

    try {
      const res = await fetch(doc.asset.url);
      if (!res.ok) {
        console.warn("Failed download", doc.slug, res.status, res.statusText);
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const jpegBuffer = await sharp(Buffer.from(arrayBuffer)).jpeg({ quality: 80 }).toBuffer();
      const uploaded = await client.assets.upload("image", jpegBuffer, {
        filename,
        contentType: "image/jpeg"
      });
      if (!uploaded?._id) {
        console.warn("Upload failed", doc.slug);
        continue;
      }
      await client.patch(doc._id).set({ image: { _type: "image", asset: { _type: "reference", _ref: uploaded._id } } }).commit();
      console.log("Refreshed", doc.slug, "→", filename);
      await sleep(200);
    } catch (error) {
      console.error("Error processing", doc.slug, error instanceof Error ? error.message : error);
      await sleep(500);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
