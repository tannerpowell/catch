import { getBrand } from "@/lib/brand";
import type { Metadata } from "next";
import MenuDisplaySetupClient from "./MenuDisplaySetupClient";

export const metadata: Metadata = {
  title: "Menu TV Display Setup",
  description: "Configure menu displays for each location",
  robots: { index: false, follow: false }
};

export const revalidate = 3600;

export default async function MenuDisplayIndex() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  // Only send slug and name to the client (avoid leaking sensitive fields)
  const locationsForClient = locations.map(l => ({ slug: l.slug, name: l.name }));

  return <MenuDisplaySetupClient locations={locationsForClient} />;
}
