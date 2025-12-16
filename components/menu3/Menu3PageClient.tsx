'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Location, MenuCategory, MenuItem } from '@/lib/types';
import { LocationBar } from './LocationBar';
import { CategoryNav } from './CategoryNav';
import { MenuList } from './MenuList';
import { PeekPreview } from './PeekPreview';
import { useNearestLocation } from '@/lib/hooks/useNearestLocation';
import { useMixitupMenu } from '@/lib/hooks/useMixitupMenu';

interface Menu3PageClientProps {
  categories: MenuCategory[];
  items: MenuItem[];
  locations: Location[];
  imageMap: Record<string, string>;
}

/**
 * Premium 3-pane menu layout.
 *
 * Desktop (>= 1024px):
 * - Top strip: Location bar with Find Nearest + dropdown
 * - Left pane (sticky): Category navigation + search
 * - Center pane: Dense item list with typography-driven rows
 * - Right pane: Contextual hover preview
 *
 * Mobile:
 * - Collapsed to single column
 * - Horizontal category chips
 * - Tap-to-peek behavior
 */
/**
 * Wrapper component that handles the empty locations case.
 * This is necessary to comply with React's rules of hooks -
 * the inner component uses hooks that must be called unconditionally.
 */
export default function Menu3PageClient(props: Menu3PageClientProps) {
  if (!props.locations.length) {
    return (
      <div className="menu3-page menu3-empty">
        <p>No locations available.</p>
      </div>
    );
  }

  return <Menu3PageClientInner {...props} />;
}

/**
 * Inner component containing all hooks and rendering logic.
 * Only rendered when locations array is non-empty.
 */
function Menu3PageClientInner({
  categories,
  items,
  locations,
  imageMap,
}: Menu3PageClientProps) {
  // Location state - safe to access locations[0] since wrapper guarantees non-empty
  const defaultLocation = locations.find(l => l.slug === 'denton') || locations[0];
  const {
    selectedSlug,
    setSelectedSlug,
    isLocating,
    geoError,
    findNearest,
    isGeoDenied,
    selectedLocation,
  } = useNearestLocation({
    locations,
    defaultSlug: defaultLocation?.slug,
    persistSelection: true,
  });

  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // MixItUp hook
  const {
    containerRef,
    isReady: mixitupReady,
    applyFilter,
    applySearch,
    searchTerm,
  } = useMixitupMenu({
    initialLocation: selectedSlug,
    initialCategory: selectedCategory,
  });

  // Peek preview state
  const [peekItem, setPeekItem] = useState<MenuItem | null>(null);
  const [peekPrice, setPeekPrice] = useState<number | null>(null);

  // Handle location change
  const handleLocationChange = useCallback((slug: string) => {
    setSelectedSlug(slug);
    applyFilter(slug, selectedCategory);
  }, [setSelectedSlug, applyFilter, selectedCategory]);

  // Handle category change
  const handleCategoryChange = useCallback((slug: string) => {
    setSelectedCategory(slug);
    applyFilter(selectedSlug, slug);
  }, [selectedSlug, applyFilter]);

  // Handle search
  const handleSearchChange = useCallback((term: string) => {
    applySearch(term);
  }, [applySearch]);

  // Handle item hover
  const handleItemHover = useCallback((item: MenuItem | null, price: number | null) => {
    setPeekItem(item);
    setPeekPrice(price);
  }, []);

  // Track whether initial filter has been applied (only runs once when MixItUp becomes ready)
  const hasAppliedInitialFilter = useRef(false);

  // Apply filter only once when MixItUp becomes ready for the first time
  // Subsequent filter changes are handled by handleLocationChange/handleCategoryChange
  React.useEffect(() => {
    if (mixitupReady && !hasAppliedInitialFilter.current) {
      hasAppliedInitialFilter.current = true;
      applyFilter(selectedSlug, selectedCategory);
    }
  }, [mixitupReady, selectedSlug, selectedCategory, applyFilter]);

  // Count visible items for display
  const visibleItemCount = useMemo(() => {
    return items.filter(item => {
      // Check location availability
      if (item.availableEverywhere) return true;
      return item.locationOverrides?.[selectedSlug]?.available === true;
    }).length;
  }, [items, selectedSlug]);

  return (
    <div className="menu3-page">
      {/* Location Bar - Top Strip */}
      <LocationBar
        locations={locations}
        selectedSlug={selectedSlug}
        onLocationChange={handleLocationChange}
        onFindNearest={findNearest}
        isLocating={isLocating}
        geoError={geoError}
        isGeoDenied={isGeoDenied}
      />

      {/* Main 3-Pane Layout */}
      <div className="menu3-layout">
        {/* Left Pane - Category Navigation */}
        <aside className="menu3-sidebar">
          <CategoryNav
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </aside>

        {/* Center Pane - Menu List */}
        <main className="menu3-main">
          <div className="menu3-main-header">
            <h1 className="menu3-main-title menu3-type-section">
              {selectedLocation?.name.replace('The Catch — ', '').replace('The Catch - ', '') || 'Menu'}
            </h1>
            <span className="menu3-item-count menu3-type-section">
              {visibleItemCount} items
            </span>
          </div>

          <MenuList
            items={items}
            locations={locations}
            selectedLocationSlug={selectedSlug}
            searchTerm={searchTerm}
            containerRef={containerRef}
            onItemHover={handleItemHover}
            imageMap={imageMap}
          />
        </main>

        {/* Right Pane - Peek Preview (Desktop only) */}
        <aside className="menu3-preview">
          <div className="menu3-preview-sticky">
            <PeekPreview
              item={peekItem}
              price={peekPrice}
              mode="dock"
            />
          </div>
        </aside>
      </div>

      <style jsx>{`
        .menu3-page {
          --menu3-location-bar-bg: #1a1a1a;
          --menu3-sidebar-bg: #f0f0f0;
          --menu3-main-bg: #ffffff;
          --menu3-preview-bg: #f5f5f5;
          --menu3-card-bg: #ffffff;
          --menu3-border: rgba(0, 0, 0, 0.06);
          --menu3-text: #1a1a1a;
          --menu3-text-secondary: #555;
          --menu3-text-muted: #888;
          --menu3-accent: #1a1a1a;
          --menu3-hover-bg: rgba(0, 0, 0, 0.02);
          --menu3-active-bg: rgba(0, 0, 0, 0.04);
          --menu3-search-bg: rgba(0, 0, 0, 0.03);
          --menu3-image-placeholder: #f0f0f0;

          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--menu3-main-bg);
        }

        /* Subway tile texture */
        .menu3-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            /* Subtle grid lines */
            linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px),
            linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px),
            /* Very faint noise overlay */
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
          background-size: 40px 40px, 40px 40px, 200px 200px;
        }

        /* 3-Pane Layout */
        .menu3-layout {
          position: relative;
          display: grid;
          grid-template-columns: 220px 1fr 400px;
          flex: 1;
          z-index: 1;
          padding: 0 20px;
        }

        /* Sidebar */
        .menu3-sidebar {
          position: sticky;
          top: 72px;
          height: calc(100vh - 72px);
          background: var(--menu3-sidebar-bg);
          border-right: 1px solid var(--menu3-border);
          overflow: hidden;
        }

        /* Main content */
        .menu3-main {
          padding: 24px 32px;
          min-width: 0;
        }

        .menu3-main-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--menu3-border);
        }

        .menu3-main-title {
          margin: 0;
          color: var(--menu3-text-muted);
        }

        .menu3-item-count {
          color: var(--menu3-text-muted);
          opacity: 0.6;
        }

        /* Preview pane */
        .menu3-preview {
          background: var(--menu3-preview-bg);
          border-left: 1px solid var(--menu3-border);
          padding: 28px;
        }

        .menu3-preview-sticky {
          position: sticky;
          top: 100px;
        }

        /* Tablet: Hide preview, show floating peek */
        @media (max-width: 1280px) {
          .menu3-layout {
            grid-template-columns: 200px 1fr;
            padding: 0 16px;
          }

          .menu3-preview {
            display: none;
          }
        }

        /* Mobile: Single column */
        @media (max-width: 1023px) {
          .menu3-layout {
            grid-template-columns: 1fr;
            padding: 0;
          }

          .menu3-sidebar {
            position: sticky;
            top: 0;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--menu3-border);
            overflow-x: auto;
            z-index: 100;
          }

          .menu3-main {
            padding: 16px;
          }

          .menu3-main-header {
            margin-bottom: 16px;
          }
        }

        /* Dark mode support */
        :global(.dark) .menu3-page {
          --menu3-location-bar-bg: #0d0d0d;
          --menu3-sidebar-bg: #111;
          --menu3-main-bg: #0a0a0a;
          --menu3-preview-bg: #0d0d0d;
          --menu3-card-bg: #1a1a1a;
          --menu3-border: rgba(255, 255, 255, 0.06);
          --menu3-text: #f0f0f0;
          --menu3-text-secondary: #aaa;
          --menu3-text-muted: #666;
          --menu3-accent: #f0f0f0;
          --menu3-hover-bg: rgba(255, 255, 255, 0.02);
          --menu3-active-bg: rgba(255, 255, 255, 0.04);
          --menu3-search-bg: rgba(255, 255, 255, 0.03);
          --menu3-image-placeholder: #1a1a1a;
        }

        :global(.dark) .menu3-page::before {
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: 40px 40px, 40px 40px, 200px 200px;
        }
      `}</style>
    </div>
  );
}
