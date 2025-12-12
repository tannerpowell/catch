import { getBrand } from "@/lib/brand";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu Display Setup",
  description: "Configure menu displays for each location",
  robots: { index: false, follow: false }
};

export const revalidate = 3600;

export default async function MenuDisplayIndex() {
  const brand = getBrand();
  const locations = await brand.getLocations();

  return (
    <div style={{
      minHeight: "100vh",
      padding: "4rem 2rem",
      background: "#0a0a0a",
      color: "#f5f5f0"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "var(--font-bodoni-moda, 'Bodoni Moda'), serif",
          fontSize: "2.5rem",
          marginBottom: "1rem",
          color: "#C9A962"
        }}>
          Menu Display Setup
        </h1>

        <p style={{
          fontSize: "1.1rem",
          color: "#a0a0a0",
          marginBottom: "2rem",
          lineHeight: 1.6
        }}>
          Select a location below to view its menu display. Open these URLs in fullscreen
          on your Mac Mini to use as digital signage.
        </p>

        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#a0a0a0",
            marginBottom: "1rem"
          }}>
            Available Locations
          </h2>

          <div style={{
            display: "grid",
            gap: "0.5rem"
          }}>
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/menu-display/${loc.slug}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.5rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f5f5f0",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontWeight: 500 }}>{loc.name}</span>
                <span style={{
                  fontSize: "0.85rem",
                  color: "#C9A962",
                  fontFamily: "monospace"
                }}>
                  /menu-display/{loc.slug}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          padding: "1.5rem",
          background: "rgba(201, 169, 98, 0.1)",
          border: "1px solid rgba(201, 169, 98, 0.3)",
          borderRadius: "4px"
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#C9A962",
            marginBottom: "0.75rem"
          }}>
            Mac Mini Kiosk Setup
          </h3>
          <ol style={{
            margin: 0,
            paddingLeft: "1.25rem",
            color: "#a0a0a0",
            lineHeight: 1.8,
            fontSize: "0.95rem"
          }}>
            <li>Open Safari or Chrome on your Mac Mini</li>
            <li>Navigate to the location URL above</li>
            <li>Enter fullscreen mode (Cmd + Ctrl + F in Safari, or F11 in Chrome)</li>
            <li>The menu will auto-rotate through categories every 30 seconds</li>
            <li>Menu data refreshes automatically every 5 minutes</li>
          </ol>
        </div>

        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px"
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#f5f5f0",
            marginBottom: "0.75rem"
          }}>
            Chrome Kiosk Mode (Recommended)
          </h3>
          <p style={{
            margin: "0 0 1rem",
            color: "#a0a0a0",
            fontSize: "0.95rem"
          }}>
            For a true kiosk experience, launch Chrome with these flags:
          </p>
          <code style={{
            display: "block",
            padding: "1rem",
            background: "#000",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#C9A962",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}>
            /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble &quot;https://yourdomain.com/menu-display/conroe&quot;
          </code>
        </div>
      </div>
    </div>
  );
}
