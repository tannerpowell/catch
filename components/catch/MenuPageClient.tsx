'use client';

import { useState, useMemo, useCallback } from "react";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import CategoryPills from "./CategoryPills";
import MenuItemCard from "./MenuItemCard";
import { findNearestLocation } from "@/lib/utils/findNearestLocation";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";
import { slugify } from "@/lib/utils/slugify";
import { formatPhone } from "@/lib/utils/formatPhone";

interface MenuPageClientProps {
  categories: MenuCategory[];
  items: MenuItem[];
  locations: Location[];
  imageMap: Record<string, string>;
}

export default function MenuPageClient({ categories, items, locations, imageMap }: MenuPageClientProps) {
  const dentonLocation = locations.find(l => l.slug === "denton");
  const [selectedSlug, setSelectedSlug] = useState<string>(dentonLocation?.slug ?? locations[0]?.slug ?? "all");
  const [isLocating, setIsLocating] = useState(false);

  // Group locations by region using the region field from Sanity
  const dfwLocations = locations.filter(loc => loc.region === 'dfw');
  const houstonLocations = locations.filter(loc => loc.region === 'houston');

  // Find nearest location handler
  const handleFindNearest = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestSlug = findNearestLocation(
          position.coords.latitude,
          position.coords.longitude,
          locations
        );
        if (nearestSlug) {
          setSelectedSlug(nearestSlug);
        }
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setIsLocating(false);
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Unable to determine your location. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }, [locations]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    categories.forEach(cat => map.set(cat.slug, []));

    items.forEach(item => {
      // OPT-IN model: only show items explicitly available at this location
      if (!isItemAvailableAtLocation(item, selectedSlug)) return;

      const itemSlug = item.slug || slugify(item.name);
      let bestImage = item.image;
      if (imageMap[itemSlug]) {
        bestImage = imageMap[itemSlug];
      }

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

  if (!safeLocation) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-400">
        <p>No locations available. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="premium-menu">
      <style jsx>{`
        .premium-menu {
          --pm-cream: #FAF7F2;
          --pm-cream-dark: #F0EBE3;
          --pm-cream-darker: #E8E2D9;
          --pm-gold: #C4A35A;
          --pm-gold-soft: rgba(196, 163, 90, 0.15);
          --pm-gold-glow: rgba(196, 163, 90, 0.08);
          --pm-text: #2C2420;
          --pm-text-soft: #5C5450;
          --pm-text-muted: #8C8480;
          --pm-shadow-soft: 0 2px 8px rgba(44, 36, 32, 0.04);
          --pm-shadow-medium: 0 4px 16px rgba(44, 36, 32, 0.06);
          --pm-shadow-neumorphic:
            4px 4px 12px rgba(44, 36, 32, 0.08),
            -4px -4px 12px rgba(255, 255, 255, 0.9);
          --pm-shadow-neumorphic-inset:
            inset 2px 2px 6px rgba(44, 36, 32, 0.06),
            inset -2px -2px 6px rgba(255, 255, 255, 0.8);
        }

        .dark .premium-menu {
          --pm-cream: #1C1917;
          --pm-cream-dark: #171412;
          --pm-cream-darker: #0F0D0B;
          --pm-gold: #D4B896;
          --pm-gold-soft: rgba(212, 184, 150, 0.15);
          --pm-gold-glow: rgba(212, 184, 150, 0.05);
          --pm-text: #F5F2EF;
          --pm-text-soft: #B8B0A8;
          --pm-text-muted: #6B6560;
          --pm-shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.2);
          --pm-shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.3);
          --pm-shadow-neumorphic:
            4px 4px 12px rgba(0, 0, 0, 0.4),
            -4px -4px 12px rgba(255, 255, 255, 0.03);
          --pm-shadow-neumorphic-inset:
            inset 2px 2px 6px rgba(0, 0, 0, 0.3),
            inset -2px -2px 6px rgba(255, 255, 255, 0.02);
        }

        /* Premium Header */
        .pm-header {
          background: linear-gradient(180deg, var(--pm-cream) 0%, var(--pm-cream-dark) 100%);
          padding: 48px 24px 32px;
          text-align: center;
          border-bottom: 1px solid var(--pm-cream-darker);
        }

        .pm-header-title {
          font-family: var(--font-lux-display);
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 400;
          color: var(--pm-text);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .pm-header-subtitle {
          font-family: var(--font-lux-body);
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--pm-text-soft);
          margin: 0;
          letter-spacing: 0.02em;
        }

        /* Location Bar */
        .pm-location-bar {
          background: var(--pm-cream);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          border-bottom: 1px solid var(--pm-cream-darker);
        }

        .pm-location-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pm-location-divider {
          width: 1px;
          height: 24px;
          background: var(--pm-cream-darker);
          margin: 0 4px;
        }

        .pm-region-label {
          font-family: var(--font-lux-body);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--pm-text-muted);
          margin-right: 4px;
        }

        /* Neumorphic Button Base */
        .pm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 24px;
          font-family: var(--font-lux-body);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: var(--pm-cream);
          color: var(--pm-text);
          box-shadow: var(--pm-shadow-neumorphic);
        }

        .pm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            6px 6px 16px rgba(44, 36, 32, 0.1),
            -6px -6px 16px rgba(255, 255, 255, 0.95);
        }

        .pm-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: var(--pm-shadow-neumorphic-inset);
        }

        .pm-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* Location Button */
        .pm-btn-location {
          padding: 8px 16px;
          font-size: 13px;
        }

        .pm-btn-location[data-active="true"] {
          background: linear-gradient(145deg, var(--pm-text) 0%, #3C3430 100%);
          color: var(--pm-cream);
          box-shadow:
            var(--pm-shadow-medium),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .pm-btn-location[data-active="true"]:hover {
          box-shadow:
            0 6px 20px rgba(44, 36, 32, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* Geo Button */
        .pm-btn-geo {
          background: linear-gradient(145deg, var(--pm-cream) 0%, var(--pm-cream-dark) 100%);
          border: 1px solid var(--pm-gold-soft);
          color: var(--pm-gold);
        }

        .pm-btn-geo:hover:not(:disabled) {
          border-color: var(--pm-gold);
          background: linear-gradient(145deg, #FFFDF8 0%, var(--pm-cream) 100%);
        }

        .pm-btn-geo svg {
          width: 14px;
          height: 14px;
        }

        /* Location Info */
        .pm-location-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          font-family: var(--font-lux-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--pm-text-soft);
          letter-spacing: 0.02em;
          padding-top: 4px;
        }

        .pm-location-info a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .pm-location-info a:hover {
          color: var(--pm-gold);
        }

        .pm-location-info-dot {
          color: var(--pm-cream-darker);
          font-size: 8px;
        }

        /* Section Wrapper */
        .pm-section {
          background: var(--pm-cream);
          padding: 48px 40px 80px;
        }

        .pm-section-inner {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Category Section */
        .pm-category-section {
          margin-bottom: 80px;
        }

        .pm-category-section:last-child {
          margin-bottom: 0;
        }

        .pm-category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--pm-cream-darker);
        }

        .pm-category-title {
          font-family: var(--font-lux-display);
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 400;
          color: var(--pm-text);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .pm-back-to-top {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-lux-body);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--pm-text-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .pm-back-to-top:hover {
          color: var(--pm-text);
          background: var(--pm-cream-dark);
        }

        .pm-back-to-top svg {
          width: 14px;
          height: 14px;
        }

        /* Menu Grid */
        .pm-menu-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }

        @media (max-width: 1200px) {
          .pm-menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
        }

        @media (max-width: 900px) {
          .pm-menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }

          .pm-header {
            padding: 36px 20px 24px;
          }

          .pm-location-bar {
            padding: 16px 20px;
          }

          .pm-section {
            padding: 32px 20px 60px;
          }

          .pm-category-section {
            margin-bottom: 60px;
          }
        }

        @media (max-width: 600px) {
          .pm-menu-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .pm-location-divider {
            display: none;
          }

          .pm-location-row {
            gap: 8px;
          }

          .pm-btn-location {
            padding: 6px 12px;
            font-size: 12px;
          }

          .pm-btn-geo {
            padding: 8px 14px;
            font-size: 12px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .pm-btn {
            transition: none;
          }

          .pm-btn:hover:not(:disabled),
          .pm-btn:active:not(:disabled) {
            transform: none;
          }
        }
      `}</style>

      {/* Premium Header */}
      <header className="pm-header">
        <h1 className="pm-header-title">Our Menu</h1>
        <p className="pm-header-subtitle">Fresh Gulf Coast seafood, prepared with care</p>
      </header>

      {/* Location Bar */}
      <div className="pm-location-bar">
        <div className="pm-location-row">
          {/* Geo Button */}
          <button
            onClick={handleFindNearest}
            disabled={isLocating}
            className="pm-btn pm-btn-geo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
            {isLocating ? 'Finding...' : 'Near Me'}
          </button>

          <span className="pm-location-divider" />

          {/* DFW Locations */}
          <span className="pm-region-label">DFW</span>
          {dfwLocations.map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="pm-btn pm-btn-location"
              data-active={selectedSlug === location.slug}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}

          <span className="pm-location-divider" />

          {/* Houston Locations */}
          <span className="pm-region-label">Houston</span>
          {houstonLocations.map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="pm-btn pm-btn-location"
              data-active={selectedSlug === location.slug}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}
        </div>

        {/* Location Info */}
        {selectedLocation && (
          <div className="pm-location-info">
            <a
              href={`https://maps.apple.com/?address=${encodeURIComponent(
                `${selectedLocation.addressLine1}, ${selectedLocation.city}, ${selectedLocation.state} ${selectedLocation.postalCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedLocation.addressLine1}, {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postalCode}
            </a>
            {selectedLocation.phone && (
              <>
                <span className="pm-location-info-dot">•</span>
                <a href={`tel:${selectedLocation.phone}`}>
                  {formatPhone(selectedLocation.phone)}
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {/* Category Pills */}
      <CategoryPills
        categories={categories.filter(cat => (itemsByCategory.get(cat.slug)?.length ?? 0) > 0)}
        activeSlug={categories[0]?.slug ?? ""}
      />

      {/* Menu Sections */}
      <div className="pm-section">
        <div className="pm-section-inner">
          {categories.map(cat => {
            const categoryItems = itemsByCategory.get(cat.slug) ?? [];
            if (categoryItems.length === 0) return null;

            const displayTitle = cat.title.replace(/& more/i, '& More');

            return (
              <section key={cat.slug} id={cat.slug} className="pm-category-section">
                <div className="pm-category-header">
                  <h2 className="pm-category-title">{displayTitle}</h2>
                  <button
                    className="pm-back-to-top"
                    onClick={(e) => {
                      e.preventDefault();
                      document.documentElement.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3L8 13M8 3L4 7M8 3L12 7" />
                    </svg>
                    Back to Top
                  </button>
                </div>
                <div className="pm-menu-grid">
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
  );
}
