import React from "react";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";

export function LocationJsonLd({ loc }: { loc: Location }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": loc.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": loc.addressLine1 + (loc.addressLine2 ? ", " + loc.addressLine2 : ""),
      "addressLocality": loc.city,
      "addressRegion": loc.state,
      "postalCode": loc.postalCode
    },
    "telephone": loc.phone,
    "hasMenu": loc.menuUrl
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function MenuJsonLd({ categories, items }: { categories: MenuCategory[]; items: MenuItem[] }) {
  const sections = categories.map(cat => ({
    "@type": "MenuSection",
    "name": cat.title,
    "hasMenuItem": items.filter(i => i.categorySlug === cat.slug).map(i => ({
      "@type": "MenuItem",
      "name": i.name,
      "description": i.description,
      "offers": i.price != null ? { "@type": "Offer", "price": i.price, "priceCurrency": "USD" } : undefined
    }))
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Restaurant Menu",
    "hasMenuSection": sections
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
