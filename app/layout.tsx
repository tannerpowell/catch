import "./globals.css";
import "./styles/dark-theme.css";
import "./styles/kitchen.css";
import "./styles/cart.css";
import { Suspense } from "react";
import HeaderSimple from "@/components/catch/HeaderSimple";
import FooterSimple from "@/components/catch/FooterSimple";
import ThemeToggle from "@/components/ThemeToggle";
import ImageModeFloatingToggle from "@/components/ImageModeFloatingToggle";
import { NavigationProgress } from "@/components/NavigationProgress";
import { RouteMarker } from "@/components/RouteMarker";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Patrick_Hand,
  Playfair_Display,
  Source_Sans_3
} from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display"
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "600", "700"]
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant-garamond",
  weight: ["400", "500", "600", "700"]
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni-moda",
  weight: ["400", "500"]
});

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-patrick-hand",
  weight: ["400"]
});

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
  const fontClassName = [
    playfair.variable,
    sourceSans.variable,
    cormorant.variable,
    bodoni.variable,
    patrickHand.variable
  ].join(" ");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
      </head>
      <body className={fontClassName}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <RouteMarker />
        <Providers>
          <HeaderSimple />
          <main>{children}</main>
          <FooterSimple />
          <ImageModeFloatingToggle />
          <ThemeToggle />
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
