import fs from "node:fs";
import path from "node:path";
import MenuPageClient from "@/components/catch/MenuPageClient";
import { getBrand } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Fresh Seafood Baskets & Boils",
  description: "Explore our menu of fresh Gulf Coast seafood: catfish baskets, shrimp boils, crawfish tails, snow crab, and house-made sides. Cajun-inspired flavors made fresh daily.",
  openGraph: {
    title: "The Catch Menu — Fresh Seafood Baskets & Boils",
    description: "Explore our menu of fresh Gulf Coast seafood: catfish baskets, shrimp boils, crawfish tails, and more.",
    images: ["/dfw-images/Different menu items served on the table, top view.jpg"]
  }
};

// Enable ISR - regenerate page every hour
export const revalidate = 3600;

type ImageMap = Record<string, string>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

export default async function MenuPage() {
  const brand = getBrand();
  const [categories, items, locations] = await Promise.all([
    brand.getCategories(),
    brand.getItems(),
    brand.getLocations()
  ]);

  const dfwImageMap = buildDfwImageMap();

  return (
    <MenuPageClient
      categories={categories}
      items={items}
      locations={locations}
      imageMap={dfwImageMap}
    />
  );
}
