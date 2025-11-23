import Link from "next/link";

export default function OurStoryPage() {
  return (
    <section className="section padding-large">
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h1 className="h1" style={{ marginBottom: "24px" }}>Our Story</h1>
        <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
          At The Catch, we're passionate about bringing authentic Gulf Coast flavors to Texas.
          Our journey started with a simple mission: serve the freshest seafood with the warmth
          and hospitality that defines coastal cuisine.
        </p>
        <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
          From hand-breaded catfish baskets to classic Cajun boils, every dish is prepared with
          care and attention to detail. We source the finest ingredients and prepare them using
          time-honored techniques that bring out the natural flavors of the Gulf.
        </p>
        <Link href="/menu" className="button">
          View Our Menu
        </Link>
      </div>
    </section>
  );
}
