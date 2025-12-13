import { Suspense } from "react";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";
import MenuDisplayClient from "./MenuDisplayClient";
import type { Metadata } from "next";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";

interface Props {
  params: Promise<{ locationSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locationSlug } = await params;
  const brand = getBrand();
  const location = await brand.getLocationBySlug(locationSlug);

  return {
    title: location ? `Menu TV Display — ${location.name}` : "Menu TV Display",
    robots: { index: false, follow: false }
  };
}

export async function generateStaticParams() {
  const brand = getBrand();
  const locations = await brand.getLocations();
  return locations.map((loc) => ({ locationSlug: loc.slug }));
}

// Revalidate every 5 minutes - balance between freshness and performance
export const revalidate = 300;

export default async function MenuDisplayPage({ params }: Props) {
  const { locationSlug } = await params;
  const brand = getBrand();

  const [location, categories, items] = await Promise.all([
    brand.getLocationBySlug(locationSlug),
    brand.getCategories(),
    brand.getItems()
  ]);

  if (!location) {
    notFound();
  }

  // OPT-IN model: only show items explicitly available at this location
  const locationItems = items.filter(item =>
    isItemAvailableAtLocation(item, locationSlug)
  );

  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading menu display...</div>}>
      <MenuDisplayClient
        location={location}
        categories={categories}
        items={locationItems}
      />
    </Suspense>
  );
}
