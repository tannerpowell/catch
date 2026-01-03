import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Gulf Coast Seafood Made Fresh",
  description: "Fresh seafood baskets, boils, and house-made sides inspired by coastal Texas. Hand-breaded catfish, jumbo shrimp, crawfish tails, and more. Visit us in Houston or Dallas-Fort Worth.",
  openGraph: {
    title: "The Catch — Gulf Coast Seafood Made Fresh",
    description: "From our kitchen to your table—baskets, boils, and house-made sides inspired by coastal Texas.",
    images: ["/dfw-images/Different menu items served on the table, top view.jpg"]
  }
};

export default function HomePage() {
  return (
    <div className="home-luxury">
      {/* Full viewport hero */}
      <section className="lux-hero">
        <div className="lux-hero__bg">
          <Image
            src="/dfw-images/the-catch-boil.jpg"
            alt="The Catch Seafood Boil"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
          <div className="lux-hero__overlay" />
        </div>

        <div className="lux-hero__content">
          <div className="lux-hero__badge">Est. Houston, Texas</div>
          <h1 className="lux-hero__title">
            <span className="lux-hero__title-line">Gulf Coast</span>
            <span className="lux-hero__title-line lux-hero__title-line--accent">Seafood</span>
          </h1>
          <p className="lux-hero__subtitle">
            Hand-breaded baskets. Traditional boils. House-made everything.
          </p>
          <div className="lux-hero__actions">
            <Link href="/menu" className="lux-btn lux-btn--primary">
              View Menu
            </Link>
            <Link href="/locations" className="lux-btn lux-btn--ghost">
              Find Location
            </Link>
          </div>
        </div>

        <div className="lux-hero__scroll">
          <span>Scroll</span>
          <div className="lux-hero__scroll-line" />
        </div>
      </section>

      {/* Signature dishes */}
      <section className="lux-signature">
        <div className="lux-signature__header">
          <span className="lux-eyebrow">From Our Kitchen</span>
          <h2 className="lux-signature__title">Signature Dishes</h2>
        </div>

        <div className="lux-signature__grid">
          <div className="lux-dish lux-dish--featured">
            <div className="lux-dish__image">
              <Image
                src="/images/hero/The_Catch_Boil_.avif"
                alt="The Catch Boil"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="lux-dish__number">01</div>
            </div>
            <div className="lux-dish__content">
              <h3 className="lux-dish__name">The Catch Boil</h3>
              <p className="lux-dish__desc">
                Jumbo shrimp, snow crab legs, crawfish, corn, and potatoes
                bathed in our signature Cajun butter.
              </p>
              <span className="lux-dish__tag">House Favorite</span>
            </div>
          </div>

          <div className="lux-dish">
            <div className="lux-dish__image">
              <Image
                src="/images/hero/Blackened_Catfish_.avif"
                alt="Blackened Catfish"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="lux-dish__number">02</div>
            </div>
            <div className="lux-dish__content">
              <h3 className="lux-dish__name">Blackened Catfish</h3>
              <p className="lux-dish__desc">
                Gulf catfish seared in cast iron with our secret Cajun spice blend.
              </p>
            </div>
          </div>

          <div className="lux-dish">
            <div className="lux-dish__image">
              <Image
                src="/images/hero/Gator App.avif"
                alt="Fried Gator Bites"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="lux-dish__number">03</div>
            </div>
            <div className="lux-dish__content">
              <h3 className="lux-dish__name">Gator Bites</h3>
              <p className="lux-dish__desc">
                Tender Louisiana alligator, hand-breaded and fried golden.
              </p>
            </div>
          </div>

          <div className="lux-dish">
            <div className="lux-dish__image">
              <Image
                src="/images/hero/Spicy Shrimp Pasta.avif"
                alt="Spicy Shrimp Pasta"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="lux-dish__number">04</div>
            </div>
            <div className="lux-dish__content">
              <h3 className="lux-dish__name">Spicy Shrimp Pasta</h3>
              <p className="lux-dish__desc">
                Gulf shrimp tossed in a creamy Cajun cream sauce.
              </p>
            </div>
          </div>

          <div className="lux-dish">
            <div className="lux-dish__image">
              <Image
                src="/images/hero/Gator Po Boy.avif"
                alt="Gator Po'Boy"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="lux-dish__number">05</div>
            </div>
            <div className="lux-dish__content">
              <h3 className="lux-dish__name">Gator Po&apos;Boy</h3>
              <p className="lux-dish__desc">
                Crispy fried gator on a buttery toasted bun with Cajun remoulade.
              </p>
            </div>
          </div>
        </div>

        <div className="lux-signature__cta">
          <Link href="/menu" className="lux-link">
            Explore Full Menu
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Story split section */}
      <section className="lux-story">
        <div className="lux-story__image">
          <Image
            src="/dfw-images/Different menu items served on the table, top view.jpg"
            alt="Seafood spread"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="lux-story__content">
          <span className="lux-eyebrow">Our Story</span>
          <h2 className="lux-story__title">
            Fresh From <br />
            <em>The Gulf</em>
          </h2>
          <p className="lux-story__text">
            Since opening our doors in Houston, we&apos;ve been serving up the authentic
            flavors of the Texas Gulf Coast. Every basket is hand-breaded, every boil
            is made to order, and every bite tells the story of our coastal heritage.
          </p>
          <p className="lux-story__text">
            From the freshest Gulf shrimp to traditional Louisiana crawfish, we source
            only the finest seafood to bring you a taste of the coast—no matter how
            far you are from the water.
          </p>
          <Link href="/our-story" className="lux-link">
            Read Our Story
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Locations ribbon */}
      {/* TODO: Location count is hardcoded - update when locations change or fetch dynamically */}
      <section className="lux-locations">
        <div className="lux-locations__inner lux-locations__inner--centered">
          <div className="lux-locations__content">
            <h2 className="lux-locations__count">17 Locations</h2>
            <p className="lux-locations__subtitle">across Texas &amp; Oklahoma</p>
            <Link href="/locations" className="lux-btn lux-btn--light">
              Find Your Table
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Tools */}
      <section className="lux-admin">
        <div className="lux-admin__inner">
          <span className="lux-eyebrow">Team Tools</span>
          <div className="lux-admin__links">
            <Link href={"/studio" as Route} className="lux-admin__link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M3 9h18" />
              </svg>
              Sanity Studio
            </Link>
            <Link href={"/kitchen" as Route} className="lux-admin__link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <circle cx="12" cy="18" r="1" />
              </svg>
              iPad
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lux-cta">
        <div className="lux-cta__bg">
          <Image
            src="/images/hero/Key Lime Pie.avif"
            alt="Key Lime Pie"
            fill
            style={{ objectFit: "cover" }}
          />
          <div className="lux-cta__overlay" />
        </div>
        <div className="lux-cta__content">
          <h2 className="lux-cta__title">Ready to Feast?</h2>
          <p className="lux-cta__text">
            Order online for pickup or find a location near you.
          </p>
          <div className="lux-cta__actions">
            <Link href="/menu" className="lux-btn lux-btn--primary">
              Order Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
