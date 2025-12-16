import { getBrand } from '@/lib/brand';
import styles from './page.module.css';
import LocationsPageClient from './LocationsPageClient';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations — Texas & Oklahoma",
  description: "Find The Catch seafood restaurant near you. 17 locations across Texas and Oklahoma including Houston, Dallas-Fort Worth, Oklahoma City, East Texas, and West Texas.",
  keywords: ["seafood restaurant Houston", "seafood restaurant Dallas", "seafood restaurant Oklahoma", "The Catch locations", "Houston seafood", "Dallas seafood", "DFW seafood", "OKC seafood"],
  openGraph: {
    title: "The Catch Locations — Texas & Oklahoma",
    description: "17 locations across Texas and Oklahoma serving fresh Gulf Coast seafood.",
    images: ["/images/events-2000px.jpg"]
  }
};

// Enable ISR - regenerate page every 24 hours (locations don't change often)
export const revalidate = 86400;

export default async function LocationsPage() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return (
    <div className={styles.locationsPage}>
      <LocationsPageClient locations={locations} />
    </div>
  );
}
