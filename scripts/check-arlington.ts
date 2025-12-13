import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cwo08xml",
  dataset: "production",
  apiVersion: "2025-10-01",
  useCdn: true,
});

const qItems = `*[_type=="menuItem"]{ _id, name, "categorySlug": category->slug.current, "overrides": coalesce(locationOverrides, [])[]{ "loc": location->slug.current, price, available } }`;

async function check() {
  const items = await client.fetch(qItems);

  console.log("=== ARLINGTON AVAILABILITY ===");

  const arlingtonItems = items.map((item: any) => {
    const override = item.overrides?.find((o: any) => o.loc === "arlington");
    return {
      name: item.name,
      category: item.categorySlug,
      available: override?.available !== false
    };
  });

  // Count available by category for Arlington
  const byCat: Record<string, number> = {};
  arlingtonItems.filter((i: any) => i.available).forEach((i: any) => {
    const cat = i.category || "null";
    byCat[cat] = (byCat[cat] || 0) + 1;
  });

  console.log("\nAvailable items by category (Arlington):");
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Total
  const totalAvailable = arlingtonItems.filter((i: any) => i.available).length;
  console.log(`\nTotal available at Arlington: ${totalAvailable}`);

  // Check Family Packs for Arlington
  const familyPacks = arlingtonItems.filter((i: any) => i.category === "family-packs" && i.available);
  console.log(`\nFamily Packs available at Arlington: ${familyPacks.length}`);
  familyPacks.forEach((i: any) => console.log(`  - ${i.name}`));
}

check().catch(console.error);
