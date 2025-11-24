import Image from "next/image";
import type { Location } from "@/lib/types";

interface MenuHeroProps {
  locations: Location[];
  selectedSlug: string;
  onLocationChange: (slug: string) => void;
  heroImage?: string;
}

export default function MenuHero({ locations, selectedSlug, onLocationChange, heroImage }: MenuHeroProps) {
  return (
    <section className="catch-paper-bg border-b border-slate-300 dark:border-slate-700">
      <div className="catch-container" style={{
        padding: "48px 24px"
      }}>
        <div className="catch-hero-grid">
          <div>
            <div className="catch-eyebrow">The Catch</div>
            <h1 className="catch-heading-1" style={{ marginTop: "12px", marginBottom: "20px" }}>
              A Menu Rooted in the Gulf
            </h1>
            <p className="catch-body" style={{ marginBottom: "24px" }}>
              Fresh baskets, boils, and house-made sides inspired by coastal Texas.
            </p>
            <div style={{ maxWidth: "320px" }}>
              <select
                value={selectedSlug}
                onChange={e => onLocationChange(e.target.value)}
                className="catch-location-select bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-700"
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  lineHeight: "1.42857",
                  fontFamily: "var(--catch-font-body)",
                  borderRadius: "0",
                  cursor: "pointer",
                  display: "block",
                  marginBottom: "10px",
                  verticalAlign: "middle"
                }}
              >
                {locations.map(loc => (
                  <option key={loc.slug} value={loc.slug}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ position: "relative", height: "400px", minHeight: "300px" }}>
            <Image
              src={heroImage || "/hero-01-cropped.jpg"}
              alt="Seafood platter"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
