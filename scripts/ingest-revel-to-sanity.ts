/**
 * Session 2: Normalize exports and optionally upsert into Sanity.
 * - Reads /data/revel/<store>/<store>.json (Playwright outputs).
 * - Reads /data/the catch dfw/the-catch-data.json (DFW scrape).
 * - Default: dry-run summary (no writes).
 * - With --out: saves normalized preview JSON.
 * - With --apply: upserts locations, categories, items into Sanity (production by default).
 *
 * Usage:
 *   npx ts-node scripts/ingest-revel-to-sanity.ts                 # dry-run summary
 *   npx ts-node scripts/ingest-revel-to-sanity.ts --out data/normalized-menu.json
 *   npx ts-node scripts/ingest-revel-to-sanity.ts --apply         # write to Sanity
 *   npx ts-node scripts/ingest-revel-to-sanity.ts --apply --out data/normalized-menu.json
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: path.resolve(".env.local") });

type RevelCategory = {
  categoryId: number;
  category: string;
  subcategories?: Array<{ id: number; name: string }>;
  items: Array<{
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number | null;
    image?: string | null;
    isAvailable: boolean;
    subcategoryIds?: number[];
  }>;
};

type RevelStore = {
  fetchedAt?: string;
  storeId: number;
  store?: string;
  url?: string;
  categories: RevelCategory[];
};

type DfwMenu = {
  menu?: {
    categories?: Array<{
      name: string;
      items: Array<{
        name: string;
        description?: string;
        price?: number;
        prices?: Record<string, number>;
      }>;
    }>;
  };
};

type NormalizedItem = {
  source: "revel" | "dfw";
  storeId?: number;
  storeName?: string;
  storeSlug: string;
  category: string;
  name: string;
  description: string;
  price?: number | null;
  priceMap?: Record<string, number>;
  image?: string | null;
  isAvailable: boolean;
  subcategoryIds?: number[];
};

type NormalizedStore = {
  storeSlug: string;
  storeId?: number;
  storeName?: string;
  url?: string;
  source: "revel" | "dfw";
  items: NormalizedItem[];
};

type Args = {
  outPath?: string | null;
  apply: boolean;
  preferDfw: boolean;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function loadRevelStores(baseDir = path.resolve("data/revel")): NormalizedStore[] {
  if (!fs.existsSync(baseDir)) return [];
  const stores: NormalizedStore[] = [];

  for (const entry of fs.readdirSync(baseDir)) {
    const storeDir = path.join(baseDir, entry);
    if (!fs.statSync(storeDir).isDirectory()) continue;

    const jsonFiles = fs.readdirSync(storeDir).filter((f) => f.endsWith(".json"));
    // Prefer store-*.json, otherwise first .json
    const storeJson = jsonFiles.find((f) => f.startsWith("store-")) || jsonFiles[0];
    if (!storeJson) continue;

    const data = readJson<RevelStore>(path.join(storeDir, storeJson));

    const items: NormalizedItem[] = [];
    for (const category of data.categories || []) {
      for (const item of category.items || []) {
        items.push({
          source: "revel",
          storeId: data.storeId,
          storeName: data.store || entry,
          storeSlug: entry,
          category: category.category,
          name: item.name,
          description: item.description || "",
          price: item.price,
          image: item.image || null,
          isAvailable: item.isAvailable,
          subcategoryIds: item.subcategoryIds || [],
        });
      }
    }

    stores.push({
      storeSlug: entry,
      storeId: data.storeId,
      storeName: data.store || entry,
      url: data.url,
      source: "revel",
      items,
    });
  }

  return stores;
}

function loadDfwMenu(dfwPath = path.resolve("data/the catch dfw/the-catch-data.json")): NormalizedStore | null {
  if (!fs.existsSync(dfwPath)) return null;
  const data = readJson<DfwMenu>(dfwPath);
  const items: NormalizedItem[] = [];

  for (const category of data.menu?.categories || []) {
    for (const item of category.items || []) {
      const priceMap = item.prices || undefined;
      const price = typeof item.price === "number" ? item.price : undefined;
      items.push({
        source: "dfw",
        storeSlug: "dfw",
        category: category.name,
        name: item.name,
        description: item.description || "",
        price,
        priceMap,
        image: null,
        isAvailable: true,
        subcategoryIds: [],
      });
    }
  }

  return {
    storeSlug: "dfw",
    storeName: "DFW Site",
    source: "dfw",
    items,
  };
}

function summarize(stores: NormalizedStore[]): void {
  console.log("== Normalized dataset ==");
  for (const store of stores) {
    const total = store.items.length;
    const priced = store.items.filter((i) => typeof i.price === "number" || i.priceMap).length;
    const withImages = store.items.filter((i) => i.image).length;
    console.log(
      `- ${store.storeSlug}${store.storeId ? ` (storeId ${store.storeId})` : ""}: ${total} items | priced: ${priced} | images: ${withImages}`
    );
  }
}

function writeOut(stores: NormalizedStore[], outPath: string): void {
  const payload = {
    generatedAt: new Date().toISOString(),
    stores,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`\nSaved normalized preview to ${outPath}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const stores: NormalizedStore[] = [...loadRevelStores()];
  const dfw = loadDfwMenu();
  if (dfw) stores.push(dfw);

  if (args.preferDfw && dfw) {
    // Remove any Revel stores that overlap DFW cities (simple approach: replace all data with DFW when storeSlug === "dfw")
    stores.splice(
      stores.findIndex((s) => s.storeSlug === "dfw"),
      1,
      dfw
    );
  }

  summarize(stores);

  if (args.outPath) {
    writeOut(stores, path.resolve(args.outPath));
  }

  if (args.apply) {
    ingestToSanity(stores).catch((err) => {
      console.error("Ingest failed:", err);
      process.exit(1);
    });
  } else {
    console.log("\nDry-run only. Pass --apply to write to Sanity.");
  }
}

function parseArgs(argv: string[]): Args {
  const outArgIndex = argv.findIndex((a) => a === "--out");
  const outPath = outArgIndex >= 0 && argv[outArgIndex + 1] ? argv[outArgIndex + 1] : null;
  const apply = argv.includes("--apply");
  const preferDfw = argv.includes("--prefer-dfw");
  return { outPath, apply, preferDfw };
}

async function ingestToSanity(stores: NormalizedStore[]) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !dataset || !token) {
    throw new Error("Sanity env vars missing: ensure NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN are set.");
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2024-08-01",
    useCdn: false,
  });

  const now = new Date().toISOString();
  const mutations: any[] = [];

  for (const store of stores) {
    // 1) Location doc (minimal; can be enriched later)
    const locationId = `location-${store.storeSlug}`;
    mutations.push({
      createIfNotExists: {
        _id: locationId,
        _type: "location",
        name: store.storeName || store.storeSlug,
        slug: { _type: "slug", current: store.storeSlug },
        menuUrl: store.url || undefined,
        // Allow enrichment later (address, phone, hours, hero)
        storeId: store.storeId,
      },
    });

    // 2) Categories
    const categoryIdMap = new Map<string, string>();
    const categories = Array.from(new Set(store.items.map((i) => i.category)));
    for (const categoryName of categories) {
      const catSlug = slugify(categoryName);
      const catId = `menuCategory-${catSlug}`;
      categoryIdMap.set(categoryName, catId);
      mutations.push({
        createIfNotExists: {
          _id: catId,
          _type: "menuCategory",
          title: categoryName,
          slug: { _type: "slug", current: catSlug },
        },
      });
    }

    // 3) Items
    for (const item of store.items) {
      const itemIdPart = item.source === "revel" && item.storeId && item.name ? `${item.storeId}-${item.name}-${itemIdSafe(item)}` : `${item.source}-${item.name}`;
      const itemId = `menuItem-${slugify(itemIdPart)}`;
      const catId = categoryIdMap.get(item.category);
      const locationRef = { _type: "reference", _ref: locationId };

      const priceVariants =
        item.priceMap &&
        Object.entries(item.priceMap).map(([label, price]) => ({
          _type: "priceVariant",
          label,
          price,
        }));

      const doc: any = {
        _id: itemId,
        _type: "menuItem",
        name: item.name,
        slug: { _type: "slug", current: slugify(item.name) },
        category: catId ? { _type: "reference", _ref: catId } : undefined,
        description: item.description || "",
        basePrice: typeof item.price === "number" ? item.price : undefined,
        priceVariants: priceVariants?.length ? priceVariants : undefined,
        imageUrl: item.image || undefined,
        externalId: item.source === "revel" ? String(itemIdSafe(item)) : undefined,
        storeId: item.storeId,
        source: item.source,
        lastSyncedAt: now,
        locationOverrides: [
          {
            _type: "locationOverride",
            location: locationRef,
            price: typeof item.price === "number" ? item.price : undefined,
            available: item.isAvailable,
          },
        ],
      };

      mutations.push({
        createOrReplace: doc,
      });
    }
  }

  console.log(`\nApplying ${mutations.length} mutations...`);
  // Chunk to avoid exceeding Sanity transaction size
  const chunkSize = 50;
  for (let i = 0; i < mutations.length; i += chunkSize) {
    const slice = mutations.slice(i, i + chunkSize);
    await client.transaction(slice).commit();
    process.stdout.write(".");
  }
  console.log("\nDone.");
}

function itemIdSafe(item: NormalizedItem): string {
  // Prefer numeric ID if present
  const parts: string[] = [];
  if (item.storeId) parts.push(String(item.storeId));
  if (item.name) parts.push(slugify(item.name));
  return parts.join("-");
}

main();
