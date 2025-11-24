'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import MenuItemCard from "./MenuItemCard";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { findNearestLocation } from "@/lib/utils/findNearestLocation";

interface Menu2PageClientProps {
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

// Pure helper function to determine if item is available at a location
// Hoisted outside component to avoid dependency array issues in useEffect hooks
function isItemAvailableAtLocation(item: MenuItem, locationSlug: string): boolean {
  if (locationSlug === "all") return true;

  if (item.locationOverrides && Object.keys(item.locationOverrides).length > 0) {
    const override = item.locationOverrides[locationSlug];
    if (!override || override.available === false) return false;
  }

  return true;
}

/**
 * Render the menu UI filtered by location and category, with a theme toggle and per-location pricing.
 *
 * Builds menu items with chosen images and location-specific prices, initializes client-side filtering,
 * and preloads item images to improve performance.
 *
 * @param categories - Array of menu categories used to build the category filter pills
 * @param items - Array of menu items to display; items may include `locationOverrides` for availability and price
 * @param locations - Array of available locations used for filtering and per-location data
 * @param imageMap - Mapping of item slugs to image URLs used to select the best image for each item
 * @returns The rendered menu page JSX element
 */
export default function Menu2PageClient({ categories, items, locations, imageMap }: Menu2PageClientProps) {
  // Default to first location (fallback if geolocation fails)
  const [selectedSlug, setSelectedSlug] = useState<string>(locations[0]?.slug ?? "");
  // Default to "Popular" category
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  // Color theme toggle: 'blue' or 'cream'
  const [colorTheme, setColorTheme] = useState<'blue' | 'cream'>('blue');
  const mixitupRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  // Split into two separate refs for cleaner types (CodeRabbit suggestion)
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemImageMapRef = useRef<Map<string, string>>(new Map());

  // Get user's geolocation
  const { latitude, longitude, loading: geoLoading } = useGeolocation();

  // Auto-select nearest location based on user's geolocation.
  // Only run while we're still on the initial default location.
  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      locations.length > 0 &&
      selectedSlug === (locations[0]?.slug ?? "")
    ) {
      const nearestSlug = findNearestLocation(latitude, longitude, locations);
      if (nearestSlug) {
        setSelectedSlug(nearestSlug);
      }
    }
  }, [latitude, longitude, locations, selectedSlug]);

  // Prepare all items with their metadata for filtering
  const allItemsWithMeta = useMemo(() => {
    return items.map(item => {
      const itemSlug = item.slug || slugify(item.name);

      // Find best available image
      let bestImage = item.image;
      if (imageMap[itemSlug]) {
        bestImage = imageMap[itemSlug];
      }

      return {
        ...item,
        image: bestImage,
        itemSlug
      };
    });
  }, [items, imageMap]);

  // Initialize Mixitup
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Dynamically import mixitup
    import('mixitup').then((mixitup) => {
      if (containerRef.current && !mixitupRef.current) {
        mixitupRef.current = mixitup.default(containerRef.current, {
          selectors: {
            target: '.mix-item'
          },
          animation: {
            duration: 300,
            effects: 'fade scale'
          },
          load: {
            // Start with first location selected
            filter: `.location-${locations[0]?.slug ?? ''}`
          }
        });
      }
    });

    return () => {
      if (mixitupRef.current) {
        mixitupRef.current.destroy();
        mixitupRef.current = null;
      }
    };
  }, [locations]);

  // Handle filtering when selectedSlug or selectedCategory changes
  useEffect(() => {
    if (!mixitupRef.current) return;

    // Location is REQUIRED - always filter by the selected location
    if (!selectedSlug) {
      // No location selected - show nothing
      mixitupRef.current.filter('none');
      return;
    }

    let filterString: string;

    // Category is optional and single-select
    if (selectedCategory) {
      // Filter by location AND category
      filterString = `.location-${selectedSlug}.category-${selectedCategory}`;
    } else {
      // No category selected - show all items for this location
      filterString = `.location-${selectedSlug}`;
    }

    mixitupRef.current.filter(filterString);
  }, [selectedSlug, selectedCategory]);

  // Helper to preload Next.js optimized image
  const preloadImage = (src: string) => {
    if (!src || preloadedImagesRef.current.has(src)) return;

    // Use w=640 to match MenuItemCard's sizes attribute behavior
    // MenuItemCard uses: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
    // Next.js will pick 640px for most viewports based on deviceSizes config
    const optimizedUrl = `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;

    // Clean up link after load to prevent accumulation
    const cleanup = () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
    link.onload = cleanup;
    link.onerror = cleanup;
    setTimeout(cleanup, 30000); // Fallback cleanup after 30s

    document.head.appendChild(link);

    preloadedImagesRef.current.add(src);

    // Track preload events for analytics (can be extended with external tracking service)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Image Preload]', { src, category: selectedCategory, location: selectedSlug });
    }
  };

  // Phase 1: Preload first 12 items immediately (above the fold for Popular + Denton)
  useEffect(() => {
    const visibleItems = allItemsWithMeta
      .filter(item => {
        const availableAtLocation = isItemAvailableAtLocation(item, selectedSlug);
        const matchesCategory = !selectedCategory || item.categorySlug === selectedCategory;
        return availableAtLocation && matchesCategory && item.image;
      })
      .slice(0, 12);

    visibleItems.forEach(item => {
      if (item.image) preloadImage(item.image);
    });
  }, [selectedSlug, selectedCategory, allItemsWithMeta]);

  // Phase 2: Create IntersectionObserver once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute('data-item-id');
            const src = itemId ? itemImageMapRef.current.get(itemId) : null;
            if (src) {
              preloadImage(src);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '200px' }
    );

    const cards = containerRef.current.querySelectorAll('.mix-item');
    cards.forEach(card => observer.observe(card));

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []); // Only create once on mount

  // Re-observe when DOM updates (mixitup filtering changes)
  useEffect(() => {
    if (!observerRef.current || !containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.mix-item');
    cards.forEach(card => observerRef.current!.observe(card));
  }, [selectedSlug, selectedCategory]);

  // Phase 2b: Update itemImageMap when filters change (reuses observer)
  useEffect(() => {
    if (!observerRef.current) return;

    const newMap = new Map(
      allItemsWithMeta
        .filter(item => {
          const availableAtLocation = isItemAvailableAtLocation(item, selectedSlug);
          const matchesCategory = !selectedCategory || item.categorySlug === selectedCategory;
          return availableAtLocation && matchesCategory && item.image;
        })
        .map(item => [item.id, item.image!])
    );

    itemImageMapRef.current = newMap;
  }, [selectedSlug, selectedCategory, allItemsWithMeta]);

  // Memoize selectedLocation lookup to avoid redundant computation
  const selectedLocation = useMemo(() => {
    return selectedSlug ? locations.find(l => l.slug === selectedSlug) : undefined;
  }, [selectedSlug, locations]);

  // Get location-specific price
  const getItemPrice = (item: MenuItem, locationSlug: string) => {
    if (locationSlug !== "all" && item.locationOverrides?.[locationSlug]?.price !== undefined) {
      return item.locationOverrides[locationSlug].price;
    }
    return item.price;
  };

  // Theme colors
  const themeColors = colorTheme === 'blue' ? {
    primary: '#1A71B3',
    secondary: 'oklch(0.72 0.09 240)',
    buttonBg: 'oklch(0.88 0.05 240)',
    buttonText: '#0d4373',
    buttonBorder: 'oklch(0.78 0.07 240)',
    buttonHoverBg: 'oklch(0.92 0.04 240)',
    buttonHoverBorder: 'oklch(0.68 0.09 240)',
    activeButtonBg: '#1A71B3',
    activeButtonBorder: '#155a8f',
  } : {
    primary: '#f5ebe0',
    secondary: '#FDF8ED',
    buttonBg: '#f9f3eb',
    buttonText: '#322723',
    buttonBorder: '#ede3d5',
    buttonHoverBg: '#ffffff',
    buttonHoverBorder: '#e8d5c4',
    activeButtonBg: '#f5ebe0',
    activeButtonBorder: '#e0d0c0',
  };

  return (
    <div className="bg-white dark:bg-slate-950">
      <style jsx>{`
        .filter-section-primary {
          background-color: ${themeColors.primary};
        }
        .dark .filter-section-primary {
          background-color: var(--slate-900);
        }
        .filter-section-secondary {
          background-color: ${themeColors.secondary};
        }
        .dark .filter-section-secondary {
          background-color: var(--slate-800);
        }
        .filter-button {
          background-color: ${themeColors.buttonBg};
          color: ${themeColors.buttonText};
          border: 1px solid ${themeColors.buttonBorder};
          transition: all 0.2s ease;
        }
        .dark .filter-button {
          background-color: var(--slate-700);
          color: var(--slate-100);
          border-color: var(--slate-600);
        }
        .filter-button:hover {
          background-color: ${themeColors.buttonHoverBg};
          border-color: ${themeColors.buttonHoverBorder};
        }
        .dark .filter-button:hover {
          background-color: var(--slate-600);
          border-color: var(--slate-500);
        }
        .location-filter-button[data-active="true"] {
          background-color: #333333;
          color: white;
          border-color: #1a1a1a;
        }
        .dark .location-filter-button[data-active="true"] {
          background-color: var(--slate-600);
          color: var(--slate-50);
          border-color: var(--slate-500);
        }
        .category-filter-button[data-active="true"] {
          background-color: ${themeColors.activeButtonBg};
          color: white;
          border-color: ${themeColors.activeButtonBorder};
        }
        .dark .category-filter-button[data-active="true"] {
          background-color: var(--slate-600);
          color: var(--slate-50);
          border-color: var(--slate-500);
        }
        .theme-toggle-button {
          background-color: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dark .theme-toggle-button {
          color: var(--slate-200);
          border-color: var(--slate-600);
        }
        .theme-toggle-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .dark .theme-toggle-button:hover {
          background-color: var(--slate-700);
          border-color: var(--slate-500);
        }
        .desktop-line-break {
          display: none;
        }
        @media (min-width: 1024px) {
          .desktop-line-break {
            display: block !important;
          }
        }
        .price-badge {
          position: absolute;
          top: 12px;
          right: -15px;
          background-color: #333333;
          color: #fafafa;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Patrick Hand", cursive;
          font-size: 26px;
          font-weight: 400;
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.09);
          z-index: 10;
          transform: rotate(5deg);
        }
        .dark .price-badge {
          background-color: var(--slate-700);
          color: var(--slate-50);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .price-badge .dollar-sign {
          font-size: 23px;
        }
      `}</style>
      {/* Location Filter Buttons */}
      <div className="filter-section-primary" style={{
        borderBottom: '1px solid var(--color--tierra-reca)',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Theme Toggle Button */}
        <button
          onClick={() => setColorTheme(colorTheme === 'blue' ? 'cream' : 'blue')}
          className="theme-toggle-button"
          style={{
            position: 'absolute',
            top: '14px',
            right: '20px'
          }}
        >
          {colorTheme === 'blue' ? 'Cream Theme' : 'Blue Theme'}
        </button>
        {/* DFW Locations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }} className="text-white dark:text-slate-300 opacity-80">DFW:</span>
          {locations.filter(loc => ['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="location-filter-button filter-button"
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
          }} className="text-white dark:text-slate-300 opacity-80">HOUSTON:</span>
          {locations.filter(loc => !['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="location-filter-button filter-button"
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
          }} className="text-white dark:text-slate-200 opacity-90">
            <a
              href={`https://maps.apple.com/?address=${encodeURIComponent(
                `${selectedLocation.addressLine1}, ${selectedLocation.city}, ${selectedLocation.state} ${selectedLocation.postalCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
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
                  className="hover:opacity-100 transition-opacity"
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

      {/* Category Filter Pills - Single-select */}
      <div className="filter-section-secondary" style={{
        borderBottom: '1px solid var(--color--tierra-reca)',
        padding: '14px 20px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: '4px'
      }}>
        <button
          onClick={() => setSelectedCategory("")}
          className="location-filter-button category-filter-button filter-button"
          data-active={selectedCategory === ""}
        >
          All Categories
        </button>
        {categories.map((cat, index) => {
          // Permanently hide Blazing Hen and Cajun Creation
          if (cat.slug === 'blazing-hen' || cat.slug === 'cajun-creation') {
            return null;
          }

          // Add line break before Sandwiches & More on desktop (1024px+)
          if (cat.slug === 'sandwiches-more') {
            return (
              <React.Fragment key={cat.slug}>
                <div
                  style={{
                    flexBasis: '100%',
                    height: 0
                  }}
                  className="desktop-line-break"
                />
                <button
                  onClick={() => setSelectedCategory(cat.slug)}
                  className="location-filter-button category-filter-button filter-button"
                  data-active={selectedCategory === cat.slug}
                >
                  {cat.title.replace(/& more/i, '& More')}
                </button>
              </React.Fragment>
            );
          }

          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className="location-filter-button category-filter-button filter-button"
              data-active={selectedCategory === cat.slug}
            >
              {cat.title.replace(/& more/i, '& More')}
            </button>
          );
        })}
      </div>

      {/* Mixitup Container */}
      <div className="section" style={{ padding: '35px 40px 60px 40px' }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="menu-item-list" ref={containerRef} style={{ gridRowGap: '20px' }}>
            {allItemsWithMeta.map(item => {
              // Build classes for Mixitup filtering
              const classes = ['mix-item'];

              // Add category class
              classes.push(`category-${item.categorySlug}`);

              // Add location classes for all locations where item is available
              locations.forEach(loc => {
                if (isItemAvailableAtLocation(item, loc.slug)) {
                  classes.push(`location-${loc.slug}`);
                }
              });

              const itemPrice = getItemPrice(item, selectedSlug);

              // Guard against undefined location (should not happen in practice, but prevent runtime crashes)
              if (!selectedLocation) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`[Menu2PageClient] No location available for item "${item.name}" - locations array is empty`);
                }
                return null;
              }

              return (
                <div key={item.id} className={classes.join(' ')} data-item-id={item.id} style={{ position: 'relative' }}>
                  <MenuItemCard
                    menuItem={{ ...item, price: itemPrice }}
                    location={selectedLocation}
                    name={item.name}
                    description={item.description}
                    price={itemPrice}
                    image={item.image}
                    isAvailable={true}
                    badges={item.badges}
                  />
                  {itemPrice != null && (
                    <div className="price-badge">
                      <span className="dollar-sign">$</span>{itemPrice.toFixed(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}