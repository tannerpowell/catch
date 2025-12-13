import fs from "node:fs";
import path from "node:path";
import Menu2PageClient from "@/components/catch/Menu2PageClient";
import { getBrand } from "@/lib/brand";
import { slugify } from "@/lib/utils/slugify";

// Enable ISR - regenerate page every hour
export const revalidate = 3600;

type ImageMap = Record<string, string>;

function buildDfwImageMap(): ImageMap {
  const dir = path.resolve("public/dfw-images");
  if (!fs.existsSync(dir)) return {};
  const entries = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f));
  const map: ImageMap = {};
  for (const file of entries) {
    const base = file.replace(/\.[^.]+$/, "");
    const key = slugify(base);
    map[key] = `/dfw-images/${file}`;
  }
  return map;
}

/**
 * Render the menu page by fetching brand categories, items, and locations, preparing an image map, and supplying them to the client component.
 *
 * The fetched locations are sorted with the location whose slug is `denton` placed first, followed by the remaining locations ordered alphabetically by name.
 *
 * @returns A React element that renders Menu2PageClient with the fetched `categories`, `items`, sorted `locations` (Denton first), and the DFW `imageMap`.
 */
export default async function Menu2Page() {
  const brand = getBrand();
  const [categories, items, rawLocations] = await Promise.all([
    brand.getCategories(),
    brand.getItems(),
    brand.getLocations()
  ]);

  // Sort locations with Denton first (default), then alphabetically
  const locations = [...rawLocations].sort((a, b) => {
    if (a.slug === 'denton') return -1;
    if (b.slug === 'denton') return 1;
    return a.name.localeCompare(b.name);
  });

  const dfwImageMap = buildDfwImageMap();

  return (
    <Menu2PageClient
      categories={categories}
      items={items}
      locations={locations}
      imageMap={dfwImageMap}
    />
  );
}