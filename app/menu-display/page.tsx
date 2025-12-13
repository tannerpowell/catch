import { getBrand } from "@/lib/brand";
import type { Metadata } from "next";
import MenuDisplaySetupClient from "./MenuDisplaySetupClient";

export const metadata: Metadata = {
  title: "Menu TV Display Setup",
  description: "Configure menu displays for each location",
  robots: { index: false, follow: false }
};

export const revalidate = 3600;

/**
 * Server component that fetches the current brand's locations and renders the menu display setup UI.
 *
 * @returns A React element rendering MenuDisplaySetupClient initialized with the brand's locations.
 */
export default async function MenuDisplayIndex() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return <MenuDisplaySetupClient locations={locations} />;
}