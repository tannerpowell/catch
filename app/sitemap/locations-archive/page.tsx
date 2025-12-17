import { getBrand } from '@/lib/brand';
import Image from 'next/image';
import styles from './page.module.css';
import LocationsContentLegacy from './LocationsContentLegacy';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations (Archive) — The Catch",
  description: "Archived locations page layout.",
  robots: "noindex, nofollow"
};

// Enable ISR - regenerate page every 24 hours
export const revalidate = 86400;

export default async function LocationsArchivePage() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.locationsHero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>Archive</div>
          <h1 className={styles.heroTitle}>Locations (Legacy)</h1>
          <p className={styles.heroSubtitle}>
            This is the archived version of the locations page
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

        <LocationsContentLegacy locations={locations} />
      </section>
    </div>
  );
}
