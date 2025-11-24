import "./globals.css";
import "./styles/dark-theme.css";
import "./styles/kitchen.css";
import "./styles/cart.css";
import HeaderSimple from "@/components/catch/HeaderSimple";
import FooterSimple from "@/components/catch/FooterSimple";
import ThemeToggle from "@/components/ThemeToggle";
import { RouteMarker } from "@/components/RouteMarker";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://thecatchdfw.com'),
  title: {
    default: "The Catch — Gulf-Inspired Seafood | Houston & Dallas",
    template: "%s | The Catch"
  },
  description: "Fresh seafood baskets, boils, and house-made sides inspired by coastal Texas. Seven locations across Houston and Dallas-Fort Worth serving the best Gulf Coast seafood.",
  keywords: ["seafood restaurant", "Gulf Coast seafood", "Houston seafood", "Dallas seafood", "catfish", "shrimp boil", "crawfish", "Texas seafood"],
  authors: [{ name: "The Catch" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thecatchdfw.com",
    siteName: "The Catch",
    title: "The Catch — Gulf-Inspired Seafood",
    description: "Fresh seafood baskets, boils, and house-made sides inspired by coastal Texas.",
    images: [
      {
        url: "/dfw-images/Different menu items served on the table, top view.jpg",
        width: 1200,
        height: 630,
        alt: "The Catch Gulf Coast Seafood"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "The Catch — Gulf-Inspired Seafood",
    description: "Fresh seafood baskets, boils, and house-made sides inspired by coastal Texas.",
    images: ["/dfw-images/Different menu items served on the table, top view.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'google-site-verification-token'
  }
};

/**
 * Renders the application's root HTML layout including global head links, route marker, providers, header, footer, and theme toggle.
 *
 * @param children - The page content to render inside the layout's main area
 * @returns The root HTML structure for the application
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Patrick+Hand&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RouteMarker />
        <Providers>
          <HeaderSimple />
          <main>{children}</main>
          <FooterSimple />
          <ThemeToggle />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}