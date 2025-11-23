/**
 * Compare DFW site menu data against Revel stores to spot potential updates.
 * Reads data/normalized-menu.json (from ingest-revel-to-sanity.ts).
 *
 * Report includes:
 * - items present in DFW but not found in any Revel store (by slug)
 * - items present in both with price differences
 * - items with description differences
 *
 * Run:
 *   npx ts-node scripts/compare-dfw-vs-revel.ts --out data/dfw-vs-revel-report.json
 */
import fs from "node:fs";
import path from "node:path";

type Item = {
  name: string;
  description?: string;
  price?: number | null;
  priceMap?: Record<string, number>;
  image?: string | null;
};

type Store = {
  storeSlug: string;
  storeId?: number;
  items: Array<Item & { slug?: string; source?: string }>;
};

type Normalized = { stores: Store[] };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadNormalized(filePath = path.resolve("data/normalized-menu.json")): Normalized {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function main() {
  const outIdx = process.argv.indexOf("--out");
  const outPath = outIdx !== -1 ? process.argv[outIdx + 1] : null;

  const data = loadNormalized();
  const dfw = data.stores.find((s) => s.storeSlug === "dfw");
  const revelStores = data.stores.filter((s) => s.storeSlug !== "dfw");

  if (!dfw) {
    console.error("No DFW store found in normalized-menu.json");
    process.exit(1);
  }

  // Index revel items by slug
  const revelMap = new Map<string, { store: string; item: Item }>();
  for (const store of revelStores) {
    for (const item of store.items) {
      const slug = slugify(item.name);
      revelMap.set(slug, { store: store.storeSlug, item });
    }
  }

  const dfwOnly: Array<{ name: string; price?: number; priceMap?: Record<string, number> }> = [];
  const priceDiffs: Array<{
    name: string;
    dfwPrice?: number | null;
    dfwPriceMap?: Record<string, number>;
    revelPrice?: number | null;
    revelStore: string;
  }> = [];
  const descDiffs: Array<{ name: string; dfwDesc: string; revelDesc: string; revelStore: string }> = [];

  for (const item of dfw.items) {
    const slug = slugify(item.name);
    const match = revelMap.get(slug);
    if (!match) {
      dfwOnly.push({ name: item.name, price: item.price ?? undefined, priceMap: item.priceMap });
      continue;
    }

    const revelItem = match.item;
    // price compare
    if (typeof item.price === "number" && typeof revelItem.price === "number" && item.price !== revelItem.price) {
      priceDiffs.push({
        name: item.name,
        dfwPrice: item.price,
        revelPrice: revelItem.price,
        revelStore: match.store,
      });
    } else if (item.priceMap && revelItem.priceMap) {
      const keys = new Set([...Object.keys(item.priceMap), ...Object.keys(revelItem.priceMap)]);
      for (const k of keys) {
        const a = item.priceMap?.[k];
        const b = (revelItem as any).priceMap?.[k];
        if (typeof a === "number" && typeof b === "number" && a !== b) {
          priceDiffs.push({
            name: `${item.name} (${k})`,
            dfwPrice: a,
            revelPrice: b,
            revelStore: match.store,
          });
        }
      }
    }

    // description compare
    const dfwDesc = (item.description || "").trim();
    const revelDesc = (revelItem.description || "").trim();
    if (dfwDesc && revelDesc && dfwDesc !== revelDesc) {
      descDiffs.push({ name: item.name, dfwDesc, revelDesc, revelStore: match.store });
    }
  }

  const report = {
    summary: {
      dfwItems: dfw.items.length,
      revelItemsIndexed: revelMap.size,
      dfwOnly: dfwOnly.length,
      priceDiffs: priceDiffs.length,
      descDiffs: descDiffs.length,
    },
    dfwOnly,
    priceDiffs,
    descDiffs,
  };

  console.log("== DFW vs Revel report ==");
  console.log(report.summary);
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`Saved report to ${path.resolve(outPath)}`);
  } else {
    console.log("Pass --out <file> to save full report.");
  }
}

main();
