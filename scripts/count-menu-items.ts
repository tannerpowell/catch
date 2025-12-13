import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cwo08xml",
  dataset: "production",
  apiVersion: "2025-10-01",
  useCdn: true,
});

async function countItems() {
  const items = await client.fetch(`*[_type == "menuItem"]{ _id, name, locationOverrides }`);
  console.log(`Total menu items: ${items.length}`);

  // Count by location
  const locations = ["conroe", "denton", "humble", "arlington", "garland"];
  for (const loc of locations) {
    const available = items.filter((item: any) => {
      const override = item.locationOverrides?.[loc];
      return override?.available !== false;
    });
    console.log(`${loc}: ${available.length} items`);
  }
}

countItems().catch(console.error);
