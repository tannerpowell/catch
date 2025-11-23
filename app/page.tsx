import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

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
    <>
      {/* Hero Section */}
      <section className="section padding-large">
        <div className="home-hero-wrapper">
          <div className="hero-content-wrapper">
            <h1 className="h1">Gulf Coast Seafood, Made Fresh</h1>
            <p className="subhead">
              From our kitchen to your table—baskets, boils, and house-made sides inspired by coastal Texas.
            </p>
            <Link href="/menu" className="button">
              View Our Menu
            </Link>
          </div>
          <div style={{ width: "100%", maxWidth: "600px", height: "400px", position: "relative" }}>
            <Image
              src="/dfw-images/Different menu items served on the table, top view.jpg"
              alt="Fresh seafood platter"
              fill
              style={{ objectFit: "cover", borderRadius: "8px" }}
              priority
            />
          </div>
        </div>
      </section>

      {/* Featured Dishes Section */}
      <section className="section padding-large" style={{ backgroundColor: "#fff" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h2 className="h2" style={{ textAlign: "center", marginBottom: "60px" }}>
            Catch of the Day
          </h2>
          <div className="home-recipes-list">
            <div className="home-recipes-item-wrapper">
              <div className="arch-image-wrapper">
                <Image
                  src="/dfw-images/catfish-basket.jpeg"
                  alt="Fried Catfish Basket"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="home-recipe-content">
                <h4 className="h4">Fried Catfish Basket</h4>
                <p className="paragraph-small">
                  Hand-breaded, fried golden, served with fries and hushpuppies
                </p>
              </div>
            </div>

            <div className="home-recipes-item-wrapper">
              <div className="arch-image-wrapper">
                <Image
                  src="/dfw-images/cajun-special.jpeg"
                  alt="Cajun Special"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="home-recipe-content">
                <h4 className="h4">Cajun Special</h4>
                <p className="paragraph-small">
                  Jumbo shrimp with corn, potatoes, and Cajun spices
                </p>
              </div>
            </div>

            <div className="home-recipes-item-wrapper">
              <div className="arch-image-wrapper">
                <Image
                  src="/dfw-images/french-quarter-plate.jpeg"
                  alt="French Quarter Plate"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="home-recipe-content">
                <h4 className="h4">French Quarter Plate</h4>
                <p className="paragraph-small">
                  A Louisiana-inspired seafood feast with all the fixings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story/CTA Section */}
      <section className="section padding-large">
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="h2" style={{ marginBottom: "24px" }}>
            Fresh From the Gulf
          </h2>
          <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
            At The Catch, we bring the flavors of the Texas coast to your plate. From hand-breaded baskets to
            classic seafood boils, every dish is made with fresh ingredients and a passion for quality.
          </p>
          <Link href="/our-story" className="button">
            Our Story
          </Link>
        </div>
      </section>

      {/* Locations CTA */}
      <section className="section" style={{ backgroundColor: "#fff" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="h2" style={{ marginBottom: "24px" }}>
            Visit Us
          </h2>
          <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
            Find a location near you and experience Gulf Coast seafood done right.
          </p>
          <Link href="/locations" className="button">
            Find a Location
          </Link>
        </div>
      </section>
    </>
  );
}
