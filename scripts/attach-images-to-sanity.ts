/**
 * Attach images to menu items in Sanity by reusing local optimized files first, then falling back
 * to downloading the remote imageUrl if needed.
 *
 * - Reads data/normalized-menu.json (items + imageUrl) and data/image-reuse-report.json (slug matches).
 * - Looks for local files whose basename contains the item slug:
 *     data/revel/.../images/
 *     public/images/
 *     images/
 * - If no local match, optionally downloads the imageUrl and uploads (JPEG) if --allow-remote is set.
 * - Only uploads when the menuItem currently lacks an image asset reference.
 *
 * Run (dry-run default):
 *   npx ts-node scripts/attach-images-to-sanity.ts
 *
 * Apply uploads:
 *   npx ts-node scripts/attach-images-to-sanity.ts --apply --allow-remote
 *
 * Options:
 *   --apply         Actually upload/patch (otherwise dry-run report)
 *   --allow-remote  If no local match, download imageUrl and upload
 *   --limit N       Process at most N items (for testing)
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";
import sharp from "sharp";
// Using Node.js native fetch (available since v18.0.0)
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env.local") });

type NormalizedPayload = {
  stores: Array<{
    storeSlug: string;
    storeId?: number;
    items: Array<{
      name: string;
      description?: string;
      image?: string | null;
      slug?: string;
      storeId?: number;
      source?: string;
      externalId?: string;
    }>;
  }>;
};

type ReuseReport = {
  slugMatches: Array<{
    slug: string;
    localPaths: string[];
    urls: string[];
    stores: string[];
  }>;
};

type Args = {
  apply: boolean;
  allowRemote: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): Args {
  return {
    apply: argv.includes("--apply"),
    allowRemote: argv.includes("--allow-remote"),
    limit: (() => {
      const idx = argv.findIndex((a) => a === "--limit");
      if (idx >= 0 && argv[idx + 1]) return Number(argv[idx + 1]);
      return undefined;
    })(),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadNormalized(filePath = path.resolve("data/normalized-menu.json")): NormalizedPayload {
  if (!fs.existsSync(filePath)) {
    throw new Error(`normalized-menu.json not found at ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as NormalizedPayload;
}

function loadReuse(filePath = path.resolve("data/image-reuse-report.json")): ReuseReport | null {
  if (!fs.existsSync(filePath)) {
    console.warn(`Reuse report not found at ${filePath}, proceeding without slug matches.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ReuseReport;
}

function findLocalMatch(slug: string, reuse: ReuseReport | null): string | null {
  if (!reuse) return null;
  const hit = reuse.slugMatches.find((m) => m.slug === slug);
  if (hit && hit.localPaths && hit.localPaths.length) {
    return hit.localPaths[0];
  }
  return null;
}

async function fetchRemoteImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function toJpeg(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).jpeg({ quality: 82 }).toBuffer();
}

async function uploadImage(client: ReturnType<typeof createClient>, buffer: Buffer, filename: string) {
  return client.assets.upload("image", buffer, { filename, contentType: "image/jpeg" });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const normalized = loadNormalized();
  const reuse = loadReuse();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new Error("Sanity env vars missing: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN");
  }

  const client = createClient({ projectId, dataset, token, apiVersion: "2024-08-01", useCdn: false });
  const toProcess: Array<{
    slug: string;
    imageUrl?: string | null;
    localPath?: string | null;
    storeId?: number;
    source?: string;
    name: string;
  }> = [];

  // Build candidate list from normalized data
  for (const store of normalized.stores) {
    for (const item of store.items) {
      const slug = slugify(item.name);
      const imageUrl = item.image || null;
      if (!imageUrl) continue; // no source image
      const localPath = findLocalMatch(slug, reuse);
      toProcess.push({ slug, imageUrl, localPath, storeId: item.storeId ?? store.storeId, source: item.source, name: item.name });
    }
  }

  const limit = args.limit ?? toProcess.length;
  let uploaded = 0;
  let skipped = 0;
  let localUsed = 0;
  let remoteUsed = 0;
  let notFound = 0;
  let alreadyHad = 0;

  console.log(`Found ${toProcess.length} items with imageUrl; processing up to ${limit}.`);

  for (let i = 0; i < Math.min(limit, toProcess.length); i++) {
    const entry = toProcess[i];
    const docId = await findItemId(client, entry.storeId, entry.slug, entry.name);
    if (!docId) {
      skipped += 1;
      notFound += 1;
      continue;
    }

    // Check if already has image asset
    const existing = await client.fetch(`*[_id == $id][0]{image}`, { id: docId });
    if (existing?.image?.asset?._ref) {
      skipped += 1;
      alreadyHad += 1;
      continue;
    }

    let buffer: Buffer | null = null;
    let filename = `${entry.slug}.jpg`;

    if (entry.localPath) {
      buffer = fs.readFileSync(entry.localPath);
      localUsed += 1;
    } else if (args.allowRemote && entry.imageUrl) {
      buffer = await fetchRemoteImage(entry.imageUrl);
      remoteUsed += 1;
    } else {
      skipped += 1;
      continue;
    }

    const jpeg = await toJpeg(buffer);

    if (args.apply) {
      const asset = await uploadImage(client, jpeg, filename);
      await client.patch(docId).set({ image: { _type: "image", asset: { _type: "reference", _ref: asset._id } } }).commit();
      uploaded += 1;
    } else {
      // Dry-run: just count
      uploaded += 1;
    }
  }

  console.log(`\nDone. Uploaded (or would upload): ${uploaded}. Skipped: ${skipped}. Local used: ${localUsed}. Remote used: ${remoteUsed}.`);
  console.log(`Skipped breakdown -> not found: ${notFound}, already had image: ${alreadyHad}`);
  if (!args.apply) {
    console.log("Dry-run only. Pass --apply to upload/patch. Add --allow-remote to fetch missing images.");
  }
}

async function findItemId(
  client: ReturnType<typeof createClient>,
  storeId: number | undefined,
  slug: string,
  name: string
): Promise<string | null> {
  const bySlug = await client.fetch(
    `*[_type == "menuItem" && slug.current == $slug && (!defined($storeId) || storeId == $storeId)][0]._id`,
    { slug, storeId }
  );
  if (bySlug) return bySlug as string;
  const byName = await client.fetch(
    `*[_type == "menuItem" && name == $name && (!defined($storeId) || storeId == $storeId)][0]._id`,
    { name, storeId }
  );
  return (byName as string) || null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
