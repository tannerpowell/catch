import { getBrand } from '@/lib/brand';
import Image from 'next/image';
import styles from './page.module.css';
import LocationsContent from '@/components/catch/LocationsContent';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations — Houston & Dallas-Fort Worth",
  description: "Find The Catch seafood restaurant near you. Seven locations across Houston (Atascocita, Conroe, Willowbrook) and Dallas-Fort Worth (Coit-Campbell, Denton, Garland, Post Oak).",
  keywords: ["seafood restaurant Houston", "seafood restaurant Dallas", "The Catch locations", "Houston seafood", "Dallas seafood", "DFW seafood"],
  openGraph: {
    title: "The Catch Locations — Houston & Dallas-Fort Worth",
    description: "Seven locations across Houston and Dallas-Fort Worth serving fresh Gulf Coast seafood.",
    images: ["/images/events-2000px.jpg"]
  }
};

// Enable ISR - regenerate page every 24 hours (locations don't change often)
export const revalidate = 86400;

export default async function LocationsPage() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.locationsHero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>The Catch</div>
          <h1 className={styles.heroTitle}>Locations</h1>
          <p className={styles.heroSubtitle}>
            Seven locations across Houston and Dallas-Fort Worth
          </p>
        </div>
        <div className={styles.heroImageWrapper}>
          <Image
            src="/images/events-2000px.jpg"
            alt="The Catch Locations"
            fill
            className={styles.heroImage}
            priority
          />
        </div>
      </section>

      {/* Map Section */}
      <section className={styles.locationsSection}>
        <div className={styles.sectionBackground}>
          <Image
            src="/images/locations-4x3.jpg"
            alt="The Catch Locations"
            fill
            className={styles.backgroundImage}
            style={{ objectFit: 'cover' }}
          />
          <div className={styles.sectionOverlay} />
        </div>

        <LocationsContent locations={locations} />
      </section>
    </div>
  );
}
