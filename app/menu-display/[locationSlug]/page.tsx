import { Suspense } from "react";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";
import MenuDisplayClient from "./MenuDisplayClient";
import type { Metadata } from "next";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";

interface Props {
  params: Promise<{ locationSlug: string }>;
}

/**
 * Create page metadata for a location-specific Menu TV Display.
 *
 * @param params - A promise resolving to an object containing `locationSlug`; the slug is used to look up the location.
 * @returns Metadata whose title is "Menu TV Display — {location.name}" when the location is found, otherwise "Menu TV Display"; robots configured to disallow indexing and following.
 */
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

/**
 * Render the TV-oriented menu display for a specific location.
 *
 * Loads the location, categories, and items for the provided `locationSlug`, filters items to those
 * available at that location, and renders the client-side MenuDisplay component inside a Suspense boundary.
 * If the location cannot be found, a 404 response is triggered.
 *
 * @param params - An awaited object containing `locationSlug`, the slug of the location to render
 * @returns A React element that renders the menu display for the specified location
 */
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
    <Suspense fallback={null}>
      <MenuDisplayClient
        location={location}
        categories={categories}
        items={locationItems}
      />
    </Suspense>
  );
}