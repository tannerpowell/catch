"use client";

import { useMemo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import { LocationBar } from "@/components/menu3/LocationBar";
import { useNearestLocation } from "@/lib/hooks/useNearestLocation";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";
import { paginateItems, type ColumnData } from "./MenuPdfDocument";

// Dynamic import for react-pdf (client-side only, no SSR)
const MenuPdfDocument = dynamic(() => import("./MenuPdfDocument"), {
  ssr: false,
  loading: () => (
    <button
      type="button"
      disabled
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        border: "none",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: "#2B7A9B",
        color: "white",
        opacity: 0.5,
        cursor: "not-allowed",
      }}
    >
      Loading...
    </button>
  ),
});

interface Props {
  locations: Location[];
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface DisplayItem {
  id: string;
  name: string;
  price: string;
  isCategory?: boolean;
  categorySlug?: string;
}

// Ghost kitchen categories - excluded from print/TV menus
const HIDDEN_CATEGORY_SLUGS = ['blazing-hen', 'cajun-creation'];

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "MKT";
  return price % 1 === 0 ? `${price}` : price.toFixed(2);
}

function getEffectivePrice(item: MenuItem, locationSlug: string): number | null {
  const override = item.locationOverrides?.[locationSlug];
  if (override?.price != null) return override.price;
  return item.price ?? null;
}

// Render a column of items
function renderColumn(data: ColumnData, isFirstInPage: boolean) {
  return (
    <div className="print-menu-column">
      {/* Show "Cont'd" header if needed */}
      {data.contdCategory && (
        <div className="print-menu-category print-menu-category--contd">
          {data.contdCategory} Cont&apos;d
        </div>
      )}
      {data.items.map((item, index) => (
        item.isCategory ? (
          <div
            key={item.id}
            className={`print-menu-category${
              index === 0 && !data.contdCategory && isFirstInPage ? " print-menu-category--first" : ""
            }`}
          >
            {item.name}
          </div>
        ) : (
          <div key={item.id} className="print-menu-item">
            <span className="print-menu-item-name">{item.name}</span>
            <span className="print-menu-item-dots" />
            <span className="print-menu-item-price">{item.price}</span>
          </div>
        )
      ))}
    </div>
  );
}

export default function PrintMenuPageClient({ locations, categories, items }: Props) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Location state - don't persist to avoid hydration mismatch
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
    persistSelection: false,
  });

  // Filter items for selected location
  const locationItems = useMemo(() => {
    return items.filter(item => isItemAvailableAtLocation(item, selectedSlug));
  }, [items, selectedSlug]);

  // Build display items with category headers
  const displayItems = useMemo(() => {
    const result: DisplayItem[] = [];
    const itemsByCategory = categories.reduce((acc, cat) => {
      acc[cat.slug] = locationItems.filter((item) => item.categorySlug === cat.slug);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    categories.forEach((category) => {
      // Skip ghost kitchens from print menus
      if (HIDDEN_CATEGORY_SLUGS.includes(category.slug)) return;

      const categoryItems = itemsByCategory[category.slug] || [];
      if (categoryItems.length === 0) return;

      result.push({
        id: `cat-${category.slug}`,
        name: category.title,
        price: "",
        isCategory: true,
        categorySlug: category.slug
      });

      categoryItems.forEach((item) => {
        result.push({
          id: item.id,
          name: item.name,
          price: formatPrice(getEffectivePrice(item, selectedSlug)),
          categorySlug: category.slug
        });
      });
    });

    return result;
  }, [categories, locationItems, selectedSlug]);

  // Paginate items for preview (same logic as PDF)
  const pages = useMemo(() => paginateItems(displayItems), [displayItems]);

  // Copy menu URL
  const handleCopyUrl = useCallback(async () => {
    const url = `${window.location.origin}/print-menu/${selectedSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  }, [selectedSlug]);

  if (!locations.length) {
    return (
      <div className="print-menu-page print-menu-empty">
        <p>No locations available.</p>
      </div>
    );
  }

  return (
    <div className="print-menu-page">
      {/* Top Bar - LocationBar on left, buttons on right */}
      <div className="print-menu-topbar">
        <LocationBar
          locations={locations}
          selectedSlug={selectedSlug}
          onLocationChange={setSelectedSlug}
          onFindNearest={findNearest}
          isLocating={isLocating}
          geoError={geoError}
          isGeoDenied={isGeoDenied}
        />
        <div className="print-menu-actions">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="print-menu-btn print-menu-btn--secondary"
            title="Copy permalink to this menu"
          >
            {copySuccess ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Copy Menu URL</span>
              </>
            )}
          </button>
          {/* PDF Download button - rendered by MenuPdfDocument */}
          <MenuPdfDocument
            displayItems={displayItems}
            locationName={selectedLocation?.name || "Menu"}
            locationCity={selectedLocation?.city || "Menu"}
          />
        </div>
      </div>

      {/* Menu Preview - Multiple Pages */}
      <div className="print-menu-preview-wrapper">
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="print-menu-page-container">
            {/* Header - Title left, Location right - first page only */}
            {page.isFirstPage && (
              <header className="print-menu-header">
                <h1 className="print-menu-title">The Catch</h1>
                <span className="print-menu-location">{selectedLocation?.city || "Menu"}</span>
              </header>
            )}

            <main className={`print-menu-content${!page.isFirstPage ? " print-menu-content--full" : ""}`}>
              {renderColumn(page.columns[0], true)}
              {renderColumn(page.columns[1], false)}
            </main>

            {/* Page number if multiple pages */}
            {pages.length > 1 && (
              <div className="print-menu-page-number">
                {pageIndex + 1}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .print-menu-page {
          min-height: 100vh;
          background: #e8e8e8;
        }

        .print-menu-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }

        /* Top Bar - matches /menu LocationBar exactly */
        .print-menu-topbar {
          display: flex;
          align-items: center;
          background: #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .print-menu-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          margin-left: auto;
        }

        /* Buttons */
        .print-menu-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-menu-ui, system-ui, sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .print-menu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .print-menu-btn--primary {
          background: #2B7A9B;
          color: white;
        }

        .print-menu-btn--primary:hover:not(:disabled) {
          background: #246a87;
          box-shadow: 0 2px 8px rgba(43, 122, 155, 0.3);
        }

        .print-menu-btn--secondary {
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .print-menu-btn--secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* Preview Wrapper */
        .print-menu-preview-wrapper {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        /* Page Container - 8.5" x 14" */
        .print-menu-page-container {
          position: relative;
          width: 8.5in;
          height: 14in;
          background: #f9f8f5;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          padding: 0.5in 0.5in 0.675in 0.5in;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header */
        .print-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25in;
          flex-shrink: 0;
        }

        .print-menu-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 24pt;
          font-weight: 400;
          font-style: italic;
          color: #1a1a1a;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .print-menu-location {
          font-family: 'Libre Franklin', system-ui, sans-serif;
          font-size: 11pt;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        /* Menu Content - 2 Columns with 0.5" gutter */
        .print-menu-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 0.5in;
          flex: 1;
          align-content: start;
        }

        /* Page Number */
        .print-menu-page-number {
          position: absolute;
          bottom: 0.375in;
          right: 0.375in;
          font-family: 'Libre Franklin', system-ui, sans-serif;
          font-size: 11pt;
          color: #666;
        }

        /* Mobile adjustments */
        @media (max-width: 900px) {
          .print-menu-topbar {
            flex-wrap: wrap;
          }

          .print-menu-actions {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .print-menu-preview-wrapper {
            padding: 1rem;
            overflow-x: auto;
          }

          .print-menu-page-container {
            transform-origin: top left;
            transform: scale(0.5);
            margin-bottom: -7in;
          }
        }

        @media (max-width: 500px) {
          .print-menu-page-container {
            transform: scale(0.35);
            margin-bottom: -9.1in;
          }
        }
      `}</style>

      {/* Global styles for elements rendered by helper functions */}
      <style jsx global>{`
        .print-menu-page-container .print-menu-column {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Category Header */
        .print-menu-page-container .print-menu-category {
          display: flex;
          align-items: center;
          gap: 8pt;
          font-family: 'Libre Franklin', system-ui, sans-serif;
          font-size: 9pt;
          font-weight: 600;
          color: #1A71B3;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding-top: 15px;
          padding-bottom: 5pt;
        }

        .print-menu-page-container .print-menu-category::before,
        .print-menu-page-container .print-menu-category::after {
          content: '';
          flex: 1;
          height: 0.5pt;
          background: #1A71B3;
          opacity: 0.5;
        }

        .print-menu-page-container .print-menu-category--first,
        .print-menu-page-container .print-menu-category--contd {
          padding-top: 0;
        }

        /* Menu Item */
        .print-menu-page-container .print-menu-item {
          display: flex;
          align-items: baseline;
          gap: 0;
          padding: 3pt 0;
          line-height: 1.35;
        }

        .print-menu-page-container .print-menu-item-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 11pt;
          font-weight: 400;
          font-style: italic;
          color: #1a1a1a;
          letter-spacing: 0.01em;
          flex-shrink: 1;
          min-width: 0;
        }

        .print-menu-page-container .print-menu-item-dots {
          flex: 1;
          min-width: 8pt;
          height: 1em;
          margin: 0 4pt;
          background-image: radial-gradient(circle, #1a1a1a 1pt, transparent 1pt);
          background-size: 5pt 5pt;
          background-position: 0 center;
          background-repeat: repeat-x;
          align-self: center;
          opacity: 0.3;
        }

        .print-menu-page-container .print-menu-item-price {
          font-family: 'Libre Franklin', system-ui, sans-serif;
          font-size: 10pt;
          font-weight: 400;
          color: #1a1a1a;
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
