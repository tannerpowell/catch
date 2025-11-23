import Link from "next/link";

export default function GiftCardsPage() {
  return (
    <section className="section padding-large">
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h1 className="h1" style={{ marginBottom: "24px" }}>Gift Cards</h1>
        <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
          Share the taste of the Gulf Coast with friends and family.
          The Catch gift cards are perfect for any occasion.
        </p>
        <p className="paragraph" style={{ marginBottom: "32px", fontSize: "18px" }}>
          Gift cards coming soon! Check back or visit any of our locations for more information.
        </p>
        <Link href="/locations" className="button">
          Find a Location
        </Link>
      </div>
    </section>
  );
}
