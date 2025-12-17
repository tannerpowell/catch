import { getBrand } from "@/lib/brand";
import type { Metadata } from "next";
import PrintMenuPageClient from "./PrintMenuPageClient";

export const metadata: Metadata = {
  title: "Print Menus - The Catch",
  description: "Printable menus for each location",
  robots: { index: false, follow: false }
};

export const revalidate = 300; // 5 minutes to match menu-display

export default async function PrintMenuIndex() {
  const brand = getBrand();

  const [locations, categories, items] = await Promise.all([
    brand.getLocations(),
    brand.getCategories(),
    brand.getItems()
  ]);

  return (
    <PrintMenuPageClient
      locations={locations}
      categories={categories}
      items={items}
    />
  );
}
