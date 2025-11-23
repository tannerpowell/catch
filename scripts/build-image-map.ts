// Build image-map.json by fuzzy matching scraped image blobs against known item slugs/titles in Sanity (or seed).
// Usage:
//   ts-node scripts/build-image-map.ts scraped-images.json sanity-seed.ndjson > image-map.json
import fs from "node:fs";
import path from "node:path";

// Counter for generating unique fallback slugs
let fallbackCounter = 0;

function slugify(s: string): string {
  const normalized = s.toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  
  // If the normalized string is empty, generate a unique fallback
  if (!normalized) {
    fallbackCounter++;
    const fallback = `item-${fallbackCounter}`;
    console.warn(`⚠️  Empty slug normalized from "${s}", generated fallback: "${fallback}"`);
    return fallback;
  }
  
  return normalized;
}

type SeedDoc = { _type: string; name?: string; slug?: { current: string }; };
type Scraped = { url:string; scrapedAt:string; images: { src:string; alt?:string; text?:string }[] };

const [,, scrapedPath, seedPath] = process.argv;
if (!scrapedPath || !seedPath) {
  console.error("Usage: ts-node scripts/build-image-map.ts scraped-images.json sanity-seed.ndjson > image-map.json");
  process.exit(1);
}

const scraped: Scraped = JSON.parse(fs.readFileSync(path.resolve(scrapedPath), "utf8"));
const seedLines = fs.readFileSync(path.resolve(seedPath), "utf8").split(/\r?\n/).filter(Boolean);
const items = seedLines.map(l => JSON.parse(l) as SeedDoc).filter(d => d._type === "menuItem");

const itemIndex = new Map<string,string>(); // slug -> title
for (const it of items) {
  const slug = it.slug?.current || slugify(it.name || "");
  const name = it.name || slug;
  itemIndex.set(slug, name);
}

function score(a:string, b:string){
  // simple token overlap score
  const A = new Set(a.split("-"));
  const B = new Set(b.split("-"));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

const mapping: Record<string,string> = {};
for (const img of scraped.images) {
  const text = [img.alt||"", img.text||"", img.src].join(" ");
  const slug = slugify(text);
  // find best item match
  let bestSlug = "";
  let bestScore = 0;
  for (const [s, name] of itemIndex.entries()) {
    const sc = Math.max(score(slug, s), score(slug, slugify(name)));
    if (sc > bestScore) { bestScore = sc; bestSlug = s; }
  }
  if (bestScore >= 0.6) {
    // only assign if we haven't yet mapped this slug
    if (!mapping[bestSlug]) mapping[bestSlug] = img.src;
  }
}

// Output JSON map
console.log(JSON.stringify(mapping, null, 2));
