/**
 * Seed geo coordinates to Sanity locations
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-08-01",
  useCdn: false,
});

// Location coordinates from official data
const geoData: Record<string, { lat: number; lng: number }> = {
  "coit-campbell": { lat: 32.977688, lng: -96.770851 },
  "conroe": { lat: 30.317270, lng: -95.478130 },
  "s-post-oak": { lat: 29.672800, lng: -95.460240 },
  "atascocita": { lat: 29.993227, lng: -95.177946 },
  "garland": { lat: 32.949788, lng: -96.651562 },
  "denton": { lat: 33.229110, lng: -97.150930 },
  "willowbrook": { lat: 29.963846, lng: -95.543372 },
};

async function main() {
  // Get all locations
  const locations = await client.fetch<Array<{ _id: string; slug: string; name: string }>>(
    `*[_type == "location"] { _id, "slug": slug.current, name }`
  );

  console.log(`Found ${locations.length} locations. Updating geo coordinates...\n`);

  for (const loc of locations) {
    const geo = geoData[loc.slug];
    if (!geo) {
      console.log(`⚠️  No geo data for ${loc.slug} (${loc.name})`);
      continue;
    }

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
  }

  console.log("\nDone!");
}

main().catch(console.error);
