'use client';

import { useState, useMemo, useEffect } from "react";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import MenuHero from "./MenuHero";
import CategoryPills from "./CategoryPills";
import MenuItemCard from "./MenuItemCard";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { findNearestLocation } from "@/lib/utils/findNearestLocation";

interface MenuPageClientProps {
  categories: MenuCategory[];
  items: MenuItem[];
  locations: Location[];
  imageMap: Record<string, string>;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  if (digits.length === 11 && digits[0] === '1') {
    // Remove leading 1 for US numbers
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const lineNumber = digits.slice(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  } else if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
  return phone; // Return original if format doesn't match
}

/**
 * Render the client-side menu page with location filtering, category grouping, and per-location image/price overrides.
 *
 * @param categories - Array of menu categories used to group and order menu items.
 * @param items - Array of menu items; items may include per-location overrides for availability and price.
 * @param locations - Array of locations used for the hero, location filters, and per-location lookups.
 * @param imageMap - Optional map of item slug to override image URL (used to prefer exact-match DFW images).
 * @returns The menu page React element containing the hero, location filter UI, category pills, and grouped menu item sections.
 */
export default function MenuPageClient({ categories, items, locations, imageMap }: MenuPageClientProps) {
  // Default to first location (fallback if geolocation fails)
  const [selectedSlug, setSelectedSlug] = useState<string>(locations[0]?.slug ?? "all");

  // Get user's geolocation
  const { latitude, longitude } = useGeolocation();

  // Auto-select nearest location based on user's geolocation.
  // Only run while we're still on the initial default location.
  useEffect(() => {
    const initialDefaultSlug = locations[0]?.slug ?? "all";
    if (
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined &&
      locations.length > 0 &&
      selectedSlug === initialDefaultSlug
    ) {
      const nearestSlug = findNearestLocation(latitude, longitude, locations);
      if (nearestSlug) {
        setSelectedSlug(nearestSlug);
      }
    }
  }, [latitude, longitude, locations, selectedSlug]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    categories.forEach(cat => map.set(cat.slug, []));

    items.forEach(item => {
      // Filter by selected location
      if (selectedSlug !== "all") {
        // Check if item has location overrides
        if (item.locationOverrides && Object.keys(item.locationOverrides).length > 0) {
          const override = item.locationOverrides[selectedSlug];
          // Skip if no override for this location (not available here)
          if (!override) return;
          // Skip if explicitly marked as unavailable
          if (override.available === false) return;
        }
        // If no location overrides exist, item is available at all locations
      }

      const itemSlug = item.slug || slugify(item.name);

      // Find best available image - prioritize exact match only
      // Priority: 1) DFW photos (exact slug match), 2) Revel default image
      let bestImage = item.image;

      // Only use DFW image if it's an exact match to avoid mismatches
      // (e.g., don't match "fried-green-tomatoes" to "fried-catfish")
      if (imageMap[itemSlug]) {
        bestImage = imageMap[itemSlug];
      }

      // Get location-specific price if available
      let itemPrice = item.price;
      if (selectedSlug !== "all" && item.locationOverrides?.[selectedSlug]?.price !== undefined) {
        itemPrice = item.locationOverrides[selectedSlug].price;
      }

      const bucket = map.get(item.categorySlug);
      if (bucket) {
        bucket.push({
          ...item,
          price: itemPrice,
          image: bestImage
        });
      }
    });

    return map;
  }, [categories, items, imageMap, selectedSlug]);

  const selectedLocation = selectedSlug !== "all" ? locations.find(l => l.slug === selectedSlug) : undefined;
  const safeLocation = selectedLocation ?? (locations.length > 0 ? locations[0] : undefined);

  // Early return if no locations available
  if (!safeLocation) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-400">
        <p>No locations available. Please check back later.</p>
      </div>
    );
  }

  return (
    <div>
      <MenuHero
        locations={locations}
        selectedSlug={selectedSlug}
        onLocationChange={setSelectedSlug}
        heroImage={selectedLocation?.heroImage}
      />

      {/* Location Filter Buttons */}
      <div style={{
        borderBottom: '1px solid var(--slate-700)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        backgroundColor: 'var(--slate-50)'
      }} className="dark:bg-slate-900 dark:border-slate-700">
        {/* DFW Locations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }} className="text-slate-600 dark:text-slate-400">DFW:</span>
          {locations.filter(loc => ['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => {
                setSelectedSlug(location.slug);
              }}
              className="location-filter-button"
              data-active={selectedSlug === location.slug}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}
        </div>

        {/* Houston Locations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }} className="text-slate-600 dark:text-slate-400">HOUSTON:</span>
          {locations.filter(loc => !['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => {
                setSelectedSlug(location.slug);
              }}
              className="location-filter-button"
              data-active={selectedSlug === location.slug}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}
        </div>

        {/* Location Info - Shows for selected location */}
        {selectedLocation && (
          <div style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '2px',
            textAlign: 'center',
            marginTop: '8px'
          }} className="text-slate-600 dark:text-slate-300">
            <a
              href={`https://maps.apple.com/?address=${encodeURIComponent(
                `${selectedLocation.addressLine1}, ${selectedLocation.city}, ${selectedLocation.state} ${selectedLocation.postalCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              style={{
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              {selectedLocation.addressLine1}, {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postalCode}
            </a>
            {selectedLocation.phone && (
              <>
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                <a
                  href={`tel:${selectedLocation.phone}`}
                  className="hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  style={{
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {formatPhone(selectedLocation.phone)}
                </a>
              </>
            )}
          </div>
        )}
      </div>

      <CategoryPills
        categories={categories.filter(cat => (itemsByCategory.get(cat.slug)?.length ?? 0) > 0)}
        activeSlug={categories[0]?.slug ?? ""}
      />

      <div className="section">
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="menu-section-wrapper">
            {categories.map(cat => {
              const categoryItems = itemsByCategory.get(cat.slug) ?? [];
              if (categoryItems.length === 0) return null;

              // Capitalize "More" in "Sandwiches & more"
              const displayTitle = cat.title.replace(/& more/i, '& More');

              return (
                <section key={cat.slug} id={cat.slug}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h2 className="h2" style={{ margin: 0 }}>{displayTitle}</h2>
                    <a
                      href="#top"
                      className="menu-filter-button"
                      onClick={(e) => {
                        e.preventDefault();
                        document.documentElement.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px' }}>
                        <path d="M8 3L8 13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back to Top
                    </a>
                  </div>
                  <div className="menu-item-list">
                    {categoryItems.map(item => (
                      <MenuItemCard
                        key={item.id}
                        menuItem={item}
                        location={selectedLocation || locations[0]}
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        image={item.image}
                        badges={item.badges}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}