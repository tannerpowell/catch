import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cwo08xml",
  dataset: "production",
  apiVersion: "2025-10-01",
  useCdn: true,
});

async function check() {
  const items = await client.fetch(`*[_type=="menuItem"]{
    name,
    "overrides": coalesce(locationOverrides, [])[]{
      "loc": location->slug.current,
      available
    }
  }`);

  // Check what locations are covered by overrides
  const locationCoverage = new Map<string, number>();

  items.forEach((item: any) => {
    (item.overrides || []).forEach((o: any) => {
      if (o.loc) {
        locationCoverage.set(o.loc, (locationCoverage.get(o.loc) || 0) + 1);
      }
    });
  });

  console.log("ITEMS WITH EXPLICIT OVERRIDES BY LOCATION:\n");
  const sorted = [...locationCoverage.entries()].sort((a, b) => b[1] - a[1]);
  sorted.forEach(([loc, count]) => {
    console.log(`  ${loc.padEnd(20)} ${count} items have explicit overrides`);
  });

  // Check which locations have NO items with overrides
  const allLocations = await client.fetch(`*[_type=="location"]{ "slug": slug.current, name }`);
  const coveredLocs = new Set(locationCoverage.keys());
  const uncoveredLocs = allLocations.filter((l: any) => coveredLocs.has(l.slug) === false);

  console.log("\n\nLOCATIONS WITH ZERO ITEM OVERRIDES (rely entirely on defaults):");
  if (uncoveredLocs.length === 0) {
    console.log("  (none - all locations have some items with overrides)");
  } else {
    uncoveredLocs.forEach((l: any) => console.log(`  - ${l.name} (${l.slug})`));
  }

  // The KEY question: how many items have available=false anywhere?
  const itemsWithFalse = items.filter((item: any) =>
    item.overrides?.some((o: any) => o.available === false)
  );

  console.log(`\n\nITEMS WITH available=false ANYWHERE: ${itemsWithFalse.length}`);

  if (itemsWithFalse.length > 0) {
    console.log("\nThese items are hidden at some locations:");
    itemsWithFalse.forEach((item: any) => {
      const hiddenAt = item.overrides.filter((o: any) => o.available === false).map((o: any) => o.loc);
      console.log(`  - ${item.name} (hidden at: ${hiddenAt.join(", ")})`);
    });
  }

  // Check the filtering logic
  console.log("\n\n========================================");
  console.log("WHY ALL LOCATIONS SHOW ALL ITEMS:");
  console.log("========================================\n");

  console.log("The filtering logic is:");
  console.log("  if (override?.available === false) return false;");
  console.log("  return true;  // Show by default\n");

  console.log("This means:");
  console.log("  - Items show at a location UNLESS explicitly set available=false");
  console.log("  - Having an override with available=true is the same as having no override");
  console.log("  - To HIDE an item, you must explicitly set available=false\n");

  console.log(`Currently: ${itemsWithFalse.length} items are hidden anywhere.`);
  console.log(`All other ${items.length - itemsWithFalse.length} items show at ALL 16 locations.`);
}

check();
