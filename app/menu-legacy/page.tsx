import MenuPageClient from "@/components/catch/MenuPageClient";
import { getBrand } from "@/lib/brand";
import { buildDfwImageMap } from "@/lib/utils/imageMap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Fresh Seafood Baskets & Boils",
  description: "Explore our menu of fresh Gulf Coast seafood: catfish baskets, shrimp boils, crawfish tails, snow crab, and house-made sides. Cajun-inspired flavors made fresh daily.",
  openGraph: {
    title: "The Catch Menu — Fresh Seafood Baskets & Boils",
    description: "Explore our menu of fresh Gulf Coast seafood: catfish baskets, shrimp boils, crawfish tails, and more.",
    images: ["/dfw-images/Different%20menu%20items%20served%20on%20the%20table,%20top%20view.jpg"]
  }
};

// Enable ISR - regenerate page every hour
export const revalidate = 3600;

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
