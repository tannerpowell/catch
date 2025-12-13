import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cwo08xml",
  dataset: "production",
  apiVersion: "2025-10-01",
  useCdn: true,
});

async function check() {
  const [items, locations] = await Promise.all([
    client.fetch(`*[_type=="menuItem"]{ _id, "overrides": coalesce(locationOverrides, [])[]{ "loc": location->slug.current, available } }`),
    client.fetch(`*[_type=="location"]{ name, "slug": slug.current } | order(name asc)`)
  ]);

  console.log("MENU ITEMS PER LOCATION\n");
  console.log("Location                    | Items Shown");
  console.log("----------------------------|------------");

  for (const loc of locations) {
    const available = items.filter((item: any) => {
      const override = item.overrides?.find((o: any) => o.loc === loc.slug);
      return override?.available !== false;
    });
    console.log(`${loc.name.padEnd(27)} | ${available.length}`);
  }

  console.log("----------------------------|------------");
  console.log(`Total menu items in Sanity  | ${items.length}`);
}

check();
