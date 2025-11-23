import EventsForm from '@/components/catch/EventsForm';
import { getBrand } from '@/lib/brand';
import Image from 'next/image';
import styles from './page.module.css';

export default async function PrivateEventsPage() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.eventsHero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroEyebrow}>The Catch</div>
            <h1 className={styles.heroTitle}>Private Events & Catering</h1>
            <p className={styles.heroSubtitle}>
              Gulf-inspired seafood for your special occasions
            </p>
          </div>
        </div>
        <div className={styles.heroImageWrapper}>
          <Image
            src="/images/events-2000px.jpg"
            alt="The Catch Private Events"
            fill
            className={styles.heroImage}
            priority
          />
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.formSection}>
        <div className={styles.container}>
          <EventsForm locations={locations.map(loc => ({ slug: loc.slug, name: loc.name }))} />
        </div>
      </section>

      {/* Info Cards */}
      <section className={styles.infoSection}>
        <div className={styles.container}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🎉</div>
              <h3 className={styles.infoTitle}>Private Parties</h3>
              <p className={styles.infoText}>
                Host birthdays, anniversaries, corporate events, and celebrations at any of our locations.
                We'll reserve space and customize a menu perfect for your group.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🦞</div>
              <h3 className={styles.infoTitle}>Catering Services</h3>
              <p className={styles.infoText}>
                Bring The Catch to your venue. Our catering packages feature fresh seafood baskets,
                boils, and Southern sides that travel beautifully.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📞</div>
              <h3 className={styles.infoTitle}>Personal Service</h3>
              <p className={styles.infoText}>
                Our events team will work with you to create a memorable experience. From menu planning
                to day-of coordination, we've got you covered.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
