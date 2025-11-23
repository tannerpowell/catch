// scripts/patch-images.ts
// Patch Sanity documents by slug → image URL (external).
// Usage:
// 1) Prepare a mapping file `image-map.json` like:
//    { "captains-combo": "https://example.com/captain.jpg", ... }
// 2) Run: ts-node scripts/patch-images.ts image-map.json
import fs from "node:fs";
import path from "node:path";
import { getSanityClient } from "../lib/sanity-config";
import { Readable } from "node:stream";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const [,, mapFile] = process.argv;
if (!mapFile) {
  console.error("Usage: ts-node scripts/patch-images.ts image-map.json");
  process.exit(1);
}

let mapping: Record<string, string>;
try {
  const resolvedPath = path.resolve(mapFile);
  
  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Mapping file not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  // Read and parse the mapping file
  const fileContent = fs.readFileSync(resolvedPath, "utf8");
  mapping = JSON.parse(fileContent);
} catch (error: any) {
  if (error.code === 'ENOENT') {
    console.error(`Mapping file not found: ${path.resolve(mapFile)}`);
  } else if (error instanceof SyntaxError) {
    console.error(`Invalid JSON in mapping file: ${error.message}`);
  } else {
    console.error(`Failed to read mapping file: ${error.message || error}`);
  }
  process.exit(1);
}

const client = getSanityClient("2025-11-22");

async function run() {
  for (const [slug, url] of Object.entries(mapping as Record<string,string>)) {
    // find item doc by slug
    const doc = await client.fetch('*[_type=="menuItem" && slug.current==$s][0]{_id, "assetId": image.asset._ref}', { s: slug });
    if (!doc?._id) {
      console.warn("No menuItem found for slug:", slug);
      continue;
    }
    if (doc.assetId) {
      console.log("Skipping", slug, "(already has image)");
      continue;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn("Failed to download", slug, url, response.status, response.statusText);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(new URL(url).pathname) || ".jpg";
      const asset = await client.assets.upload("image", buffer, {
        filename: `${slug}${ext}`,
        contentType: response.headers.get("content-type") || "image/jpeg"
      });
      if (!asset?._id) {
        console.warn("Failed to upload asset for", slug);
        continue;
      }
      await client
        .patch(doc._id)
        .set({ image: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
        .commit();
      console.log("Patched", slug);
    } catch (error: any) {
      console.error("Patch failed", slug, error.message || error);
    }
  }
}
run().catch(e => { console.error(e); process.exit(1); });
