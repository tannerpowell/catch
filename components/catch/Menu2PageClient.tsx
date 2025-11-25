'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import MenuItemCard from "./MenuItemCard";
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
  // Default to Denton (fallback if geolocation fails)
  const dentonLocation = locations.find(l => l.slug === "denton");
  const [selectedSlug, setSelectedSlug] = useState<string>(dentonLocation?.slug ?? locations[0]?.slug ?? "");
  // Default to "Popular" category
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  // Color theme toggle: 'blue' or 'cream'
  const [colorTheme, setColorTheme] = useState<'blue' | 'cream'>('blue');
  // Location finding state
  const [isLocating, setIsLocating] = useState(false);
  // Track when MixItup is ready
  const [mixitupReady, setMixitupReady] = useState(false);
  const mixitupRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  // Split into two separate refs for cleaner types (CodeRabbit suggestion)
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemImageMapRef = useRef<Map<string, string>>(new Map());

  // Find nearest location on user request (not auto)
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
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }, [locations]);

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
        const dentonLocation = locations.find(l => l.slug === "denton");
        const initialSlug = dentonLocation?.slug ?? locations[0]?.slug ?? "";
        // Start with both location AND category filter (popular is default)
        const initialFilter = `.location-${initialSlug}.category-${selectedCategory}`;
        mixitupRef.current = mixitup.default(containerRef.current, {
          selectors: {
            target: '.mix-item'
          },
          animation: {
            duration: 300,
            effects: 'fade scale'
          },
          load: {
            // Start with Denton location AND popular category selected
            filter: initialFilter
          }
        });
        setMixitupReady(true);
      }
    });

    return () => {
      if (mixitupRef.current) {
        mixitupRef.current.destroy();
        mixitupRef.current = null;
        setMixitupReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Handle filtering when selectedSlug or selectedCategory changes
  useEffect(() => {
    if (!mixitupReady || !mixitupRef.current) return;

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
  }, [selectedSlug, selectedCategory, mixitupReady]);

  // Helper to preload Next.js optimized image
  // Wrapped in useCallback to prevent stale closures in IntersectionObserver
  const preloadImage = React.useCallback((src: string) => {
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
  }, [selectedCategory, selectedSlug]);

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
  }, [selectedSlug, selectedCategory, allItemsWithMeta, preloadImage]);

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
        .find-nearest-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.6);
        }
        .dark .find-nearest-button {
          border-color: var(--slate-600);
        }
        .dark .find-nearest-button:hover:not(:disabled) {
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
      {/* Location Filter Bar */}
      <div className="filter-section-primary" style={{
        borderBottom: '1px solid var(--color--tierra-reca)',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* All Locations - Single Line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Find Nearest CTA */}
          <button
            onClick={handleFindNearest}
            disabled={isLocating}
            className="find-nearest-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.5px',
              cursor: isLocating ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLocating ? 0.7 : 1
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
            {isLocating ? 'Finding...' : 'Find Nearest'}
          </button>

          <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>|</span>

          {/* DFW Label + Locations */}
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginRight: '2px'
          }} className="text-white dark:text-slate-300 opacity-70">DFW:</span>
          {locations.filter(loc => ['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="location-filter-button filter-button"
              data-active={selectedSlug === location.slug}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}

          <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>|</span>

          {/* Houston Label + Locations */}
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginRight: '2px'
          }} className="text-white dark:text-slate-300 opacity-70">HOUSTON:</span>
          {locations.filter(loc => !['denton', 'coit-campbell', 'garland'].includes(loc.slug)).map(location => (
            <button
              key={location.slug}
              onClick={() => setSelectedSlug(location.slug)}
              className="location-filter-button filter-button"
              data-active={selectedSlug === location.slug}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {location.name.replace('The Catch — ', '')}
            </button>
          ))}
        </div>

      </div>

      {/* Category Filter Pills - Single-select */}
      <div className="filter-section-secondary" style={{
        borderBottom: '1px solid var(--color--tierra-reca)',
        padding: '10px 20px',
        display: 'flex',
        gap: '6px',
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