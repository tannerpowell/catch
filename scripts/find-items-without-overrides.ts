/**
 * Find items without location overrides (available everywhere)
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

async function main() {
  // Find items without location overrides (available everywhere)
  const itemsWithoutOverrides = await client.fetch<Array<{
    _id: string;
    name: string;
    source?: string;
  }>>(
    `*[_type == "menuItem" && (!defined(locationOverrides) || count(locationOverrides) == 0)] {
      _id, name, source
    }`
  );

  console.log(`Found ${itemsWithoutOverrides.length} items without location overrides:\n`);
  itemsWithoutOverrides.forEach((item) => {
    console.log(`- ${item.name} (source: ${item.source || "none"})`);
  });
}

main().catch(console.error);
