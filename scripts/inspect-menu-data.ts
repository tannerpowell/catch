import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cwo08xml",
  dataset: "production",
  apiVersion: "2025-10-01",
  useCdn: true,
});

async function inspectData() {
  // Get categories with their order
  const categories = await client.fetch(`*[_type == "menuCategory"] | order(order asc) {
    _id, title, slug, order
  }`);

  console.log("=== CATEGORIES (ordered) ===");
  categories.forEach((cat: any, i: number) => {
    console.log(`${i + 1}. ${cat.title} (slug: ${cat.slug?.current || cat.slug}, order: ${cat.order})`);
  });

  // Get items for Arlington to check Family Packs
  const items = await client.fetch(`*[_type == "menuItem"] {
    _id, name, categorySlug, locationOverrides
  }`);

  console.log("\n=== FAMILY PACKS ITEMS ===");
  const familyPackItems = items.filter((item: any) =>
    item.categorySlug === "family-packs" || item.categorySlug === "family-pack"
  );
  console.log(`Found ${familyPackItems.length} family pack items`);
  familyPackItems.forEach((item: any) => {
    const arlingtonOverride = item.locationOverrides?.arlington;
    console.log(`- ${item.name} (arlington available: ${arlingtonOverride?.available !== false})`);
  });

  // Check if locations have unique menus
  console.log("\n=== LOCATION-SPECIFIC AVAILABILITY ===");
  const locations = ["arlington", "denton", "conroe", "humble"];

  for (const loc of locations) {
    const unavailableCount = items.filter((item: any) => {
      const override = item.locationOverrides?.[loc];
      return override?.available === false;
    }).length;
    console.log(`${loc}: ${items.length - unavailableCount} available (${unavailableCount} hidden)`);
  }

  // Check total items by category
  console.log("\n=== ITEMS PER CATEGORY ===");
  const byCat: Record<string, number> = {};
  items.forEach((item: any) => {
    const cat = item.categorySlug || "uncategorized";
    byCat[cat] = (byCat[cat] || 0) + 1;
  });
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`);
  });
}

inspectData().catch(console.error);
