/**
 * Seed geo coordinates to Sanity locations
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";
import { fallbackGeoCoordinates } from "@/lib/adapters/sanity-catch";

dotenv.config({ path: path.resolve(".env.local") });

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  console.error("❌ Error: NEXT_PUBLIC_SANITY_PROJECT_ID is not defined in .env.local");
  process.exit(1);
}

if (!token) {
  console.error("❌ Error: SANITY_WRITE_TOKEN is not defined in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: dataset || "production",
  token,
  apiVersion: "2024-08-01",
  useCdn: false,
});

// Import geo coordinates from adapter to avoid duplication
const geoData = fallbackGeoCoordinates;

async function main() {
  // Get all locations
  const locations = await client.fetch<Array<{ _id: string; slug: string; name: string }>>(
    `*[_type == "location"] { _id, "slug": slug.current, name }`
  );

  console.log(`Found ${locations.length} locations. Updating geo coordinates...\n`);

  const errors: Array<{ slug: string; error: unknown }> = [];

  for (const loc of locations) {
    const geo = geoData[loc.slug];
    if (!geo) {
      console.log(`⚠️  No geo data for ${loc.slug} (${loc.name})`);
      continue;
    }

    try {
      await client
        .patch(loc._id)
        .set({
          geo: {
            _type: "geopoint",
            lat: geo.lat,
            lng: geo.lng,
          },
        })
        .commit();

      console.log(`✅ Updated ${loc.slug}: ${geo.lat}, ${geo.lng}`);
    } catch (error) {
      console.error(`❌ Failed to update ${loc.slug}:`, error);
      errors.push({ slug: loc.slug, error });
    }
  }

  if (errors.length > 0) {
    console.log(`\n⚠️  Completed with ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log("\n✅ Done!");
}

main().catch(console.error);
