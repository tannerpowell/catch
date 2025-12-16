"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";
import { paginateItems, type ColumnData } from "../MenuPdfDocument";
import type { DisplayItem } from "../PrintMenuPageClient";

// Dynamic import for react-pdf (client-side only)
const MenuPdfDocument = dynamic(() => import("../MenuPdfDocument"), {
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
  location: Location;
  categories: MenuCategory[];
  items: MenuItem[];
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

export default function PrintMenuClient({ location, categories, items }: Props) {
  // Filter items for this location
  const locationItems = useMemo(() => {
    return items.filter(item => isItemAvailableAtLocation(item, location.slug));
  }, [items, location.slug]);

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
          price: formatPrice(getEffectivePrice(item, location.slug)),
          categorySlug: category.slug
        });
      });
    });

    return result;
  }, [categories, locationItems, location.slug]);

  // Paginate items for preview (same logic as PDF)
  const pages = useMemo(() => paginateItems(displayItems), [displayItems]);

  return (
    <div className="print-menu-page">
      {/* Top Bar */}
      <div className="print-menu-topbar">
        <span className="print-menu-location-label">{location.name}</span>
        <div className="print-menu-actions">
          {/* PDF Download button */}
          <MenuPdfDocument
            displayItems={displayItems}
            locationName={location.name}
            locationCity={location.city}
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
                <span className="print-menu-location">{location.city}</span>
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

        /* Top Bar */
        .print-menu-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1a1a1a;
          padding: 12px 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .print-menu-location-label {
          font-family: var(--font-menu-ui, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 500;
          color: white;
          letter-spacing: 0.02em;
        }

        .print-menu-actions {
          display: flex;
          align-items: center;
          gap: 10px;
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

        /* Menu Content - 2 Columns */
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
