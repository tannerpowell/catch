import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";
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
  apiVersion: "2025-10-01",
  token,
  useCdn: false
});

const productsPath = path.resolve(process.cwd(), "revel-products.json");
if (!fs.existsSync(productsPath)) {
  throw new Error("revel-products.json not found");
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
  const data = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const map = new Map<string, { description: string; price: number | null }>();

  for (const category of data.categories) {
    for (const item of category.items) {
      map.set(slugify(item.name), {
        description: item.description || "",
        price: typeof item.price === "number" ? item.price : null
      });
    }
  }

  const docs: Array<{ _id: string; slug?: { current?: string }; description?: string; price?: number | null }> =
    await client.fetch(`*[_type == "menuItem"]{ _id, slug, description, price }`);

  let updated = 0;
  for (const doc of docs) {
    const slug = doc.slug?.current;
    if (!slug) continue;
    const match = map.get(slug.toLowerCase());
    if (!match) continue;

    const patch: Record<string, unknown> = {};
    if ((!doc.description || doc.description.trim().length === 0) && match.description) {
      patch.description = match.description;
    }
    if ((doc.price === null || doc.price === undefined) && typeof match.price === "number") {
      patch.price = match.price;
    }
    if (Object.keys(patch).length === 0) continue;

    await client.patch(doc._id).set(patch).commit();
    updated += 1;
  }

  console.log(`Patched ${updated} menu items with Revel descriptions/prices.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
