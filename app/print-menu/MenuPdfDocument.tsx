"use client";

import { useState, useMemo } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { DisplayItem } from "./PrintMenuPageClient";

// 8.5" x 14" = 612pt x 1008pt
// 0.5" margins all around = 36pt
// Two columns with 0.5" (36pt) gutter
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 1008;
const MARGIN_TOP = 36; // 0.5"
const MARGIN_BOTTOM = 49; // 0.675"
const MARGIN_LR = 36; // 0.5"
const GUTTER = 36; // 0.5"
const COLUMN_WIDTH = (PAGE_WIDTH - 2 * MARGIN_LR - GUTTER) / 2; // 252pt

// Height calculations based on actual CSS:
// Page: 14in = 1008pt, top 0.5" (36pt), bottom 0.675" (49pt), usable = 923pt per column
// Header: ~50pt (title + location + margin-bottom)
// Safety buffer: 20pt to ensure we never overflow
const HEADER_HEIGHT = 50;
const SAFETY_BUFFER = 20;
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - SAFETY_BUFFER; // 903pt per column
const CONTENT_HEIGHT_FIRST_PAGE = CONTENT_HEIGHT - HEADER_HEIGHT; // 853pt (with header)

// Item heights based on actual CSS measurements:
// .print-menu-item: font-size 11pt, line-height 1.35, padding 3pt top/bottom
// = 11 * 1.35 + 6 = ~21pt per item
// .print-menu-category: font-size 9pt, padding-top 15px (~11pt), padding-bottom 5pt
// = 9 + 11 + 5 = ~25pt, but with line decorations ~28pt
// First category has no padding-top = ~17pt
const ITEM_HEIGHT = 21;
const CATEGORY_HEIGHT = 28;
const CATEGORY_FIRST_HEIGHT = 17;
const CONTD_HEIGHT = 17; // Same as first category (no top padding)

// PDF Styles - using built-in fonts (Helvetica, Times-Roman)
const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    paddingTop: MARGIN_TOP,
    paddingBottom: MARGIN_BOTTOM,
    paddingLeft: MARGIN_LR,
    paddingRight: MARGIN_LR,
    backgroundColor: "#f9f8f5",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTitle: {
    fontFamily: "Times-Roman",
    fontSize: 24,
    color: "#1a1a1a",
  },
  headerLocation: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    gap: GUTTER,
  },
  column: {
    width: COLUMN_WIDTH,
    flexDirection: "column",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    marginBottom: 4,
  },
  categoryHeaderFirst: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#1A71B3",
    opacity: 0.5,
  },
  categoryText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#1A71B3",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    paddingHorizontal: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 2,
  },
  itemName: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#1a1a1a",
    flexShrink: 1,
  },
  itemDots: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    borderBottomStyle: "dotted",
    minWidth: 10,
  },
  itemPrice: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    textAlign: "right",
  },
  pageNumber: {
    position: "absolute",
    bottom: 27, // 0.375"
    right: 27, // 0.375"
    fontSize: 11,
    color: "#666",
    fontFamily: "Helvetica",
  },
});

interface MenuPdfProps {
  displayItems: DisplayItem[];
  locationName: string;
  locationCity: string;
}

interface ColumnData {
  items: DisplayItem[];
  contdCategory?: string;
}

interface PageData {
  columns: [ColumnData, ColumnData];
  isFirstPage: boolean;
}

// Get the size of a category (header + all its items) starting at given index
function getCategorySize(items: DisplayItem[], categoryIndex: number): { itemCount: number; height: number } {
  if (!items[categoryIndex]?.isCategory) {
    return { itemCount: 0, height: 0 };
  }

  let count = 1; // The category header
  let height = CATEGORY_HEIGHT;

  // Count items until next category or end
  for (let i = categoryIndex + 1; i < items.length; i++) {
    if (items[i].isCategory) break;
    count++;
    height += ITEM_HEIGHT;
  }

  return { itemCount: count, height };
}

// Calculate height for a range of items
function calculateItemsHeight(items: DisplayItem[], startIdx: number, endIdx: number, isFirstInColumn: boolean): number {
  let height = 0;
  let first = isFirstInColumn;
  for (let i = startIdx; i < endIdx; i++) {
    const item = items[i];
    if (item.isCategory) {
      height += first ? CATEGORY_FIRST_HEIGHT : CATEGORY_HEIGHT;
    } else {
      height += ITEM_HEIGHT;
    }
    first = false;
  }
  return height;
}

// Calculate paginated layout - keep sections together when possible
function paginateItems(displayItems: DisplayItem[]): PageData[] {
  const pages: PageData[] = [];
  let itemIndex = 0;
  let currentCategory: string | undefined;
  let isFirstPage = true;

  while (itemIndex < displayItems.length) {
    const columnHeight = isFirstPage ? CONTENT_HEIGHT_FIRST_PAGE : CONTENT_HEIGHT;
    const totalPageHeight = columnHeight * 2; // Both columns combined

    // Build list of items for this page, keeping sections together when possible
    const pageItems: DisplayItem[] = [];
    let totalHeight = 0;
    let needsContdLeft = currentCategory && !displayItems[itemIndex]?.isCategory;

    if (needsContdLeft) {
      totalHeight += CONTD_HEIGHT;
    }

    let isFirst = !needsContdLeft;
    let localIndex = itemIndex;

    while (localIndex < displayItems.length) {
      const item = displayItems[localIndex];

      if (item.isCategory) {
        // Check if the ENTIRE category fits on this page
        const categorySize = getCategorySize(displayItems, localIndex);
        const categoryHeaderHeight = isFirst ? CATEGORY_FIRST_HEIGHT : CATEGORY_HEIGHT;
        const fullCategoryHeight = categoryHeaderHeight + (categorySize.itemCount - 1) * ITEM_HEIGHT;

        // If category won't fit entirely AND it's small enough to fit on next page, skip it
        if (totalHeight + fullCategoryHeight > totalPageHeight) {
          // Category won't fit entirely on this page
          // Check if it would fit on a fresh page (next page)
          const freshPageHeight = (isFirstPage ? CONTENT_HEIGHT : CONTENT_HEIGHT) * 2;
          const categoryOnFreshPage = CATEGORY_FIRST_HEIGHT + (categorySize.itemCount - 1) * ITEM_HEIGHT;

          if (categoryOnFreshPage <= freshPageHeight) {
            // Category fits on next page entirely - don't split it, stop here
            break;
          }
          // Category is too big for any single page - we must split it
        }

        // Check if even just the header + 1 item fits
        if (totalHeight + categoryHeaderHeight + ITEM_HEIGHT > totalPageHeight) {
          break;
        }

        currentCategory = item.name;
      } else {
        // Regular item
        if (totalHeight + ITEM_HEIGHT > totalPageHeight) {
          break;
        }
      }

      const itemHeight = item.isCategory
        ? (isFirst ? CATEGORY_FIRST_HEIGHT : CATEGORY_HEIGHT)
        : ITEM_HEIGHT;

      pageItems.push(item);
      totalHeight += itemHeight;
      localIndex++;
      isFirst = false;
    }

    // Now split pageItems between two columns, preferring category boundaries
    let bestSplit = Math.ceil(pageItems.length / 2);
    let bestDiff = Infinity;

    // Find category boundaries in pageItems
    const boundaries: number[] = [];
    for (let i = 1; i < pageItems.length; i++) {
      if (pageItems[i].isCategory) {
        boundaries.push(i);
      }
    }

    // Try each category boundary as split point
    for (const boundaryIdx of boundaries) {
      const leftHeight = calculateItemsHeight(pageItems, 0, boundaryIdx, !needsContdLeft);
      const adjustedLeftHeight = needsContdLeft ? leftHeight + CONTD_HEIGHT : leftHeight;

      if (adjustedLeftHeight > columnHeight) continue;

      const rightNeedsContd = !pageItems[boundaryIdx]?.isCategory;
      const rightHeight = calculateItemsHeight(pageItems, boundaryIdx, pageItems.length, !rightNeedsContd);
      const adjustedRightHeight = rightNeedsContd ? rightHeight + CONTD_HEIGHT : rightHeight;

      if (adjustedRightHeight > columnHeight) continue;

      const diff = Math.abs(adjustedLeftHeight - adjustedRightHeight);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSplit = boundaryIdx;
      }
    }

    // If no good category boundary, find where left column fills up
    if (bestDiff === Infinity) {
      let leftHeight = needsContdLeft ? CONTD_HEIGHT : 0;
      let isFirstLeft = !needsContdLeft;

      for (let i = 0; i < pageItems.length; i++) {
        const item = pageItems[i];
        const itemHeight = item.isCategory
          ? (isFirstLeft ? CATEGORY_FIRST_HEIGHT : CATEGORY_HEIGHT)
          : ITEM_HEIGHT;

        if (leftHeight + itemHeight > columnHeight) {
          bestSplit = i;
          break;
        }

        leftHeight += itemHeight;
        bestSplit = i + 1;
        isFirstLeft = false;
      }
    }

    // Build the page columns
    const pageColumns: [ColumnData, ColumnData] = [
      { items: [] },
      { items: [] },
    ];

    // Left column
    if (needsContdLeft) {
      pageColumns[0].contdCategory = currentCategory;
    }
    for (let i = 0; i < bestSplit; i++) {
      pageColumns[0].items.push(pageItems[i]);
      if (pageItems[i].isCategory) {
        currentCategory = pageItems[i].name;
      }
    }

    // Remove trailing orphan categories from left column
    while (pageColumns[0].items.length > 0 &&
           pageColumns[0].items[pageColumns[0].items.length - 1].isCategory) {
      pageColumns[0].items.pop();
      bestSplit--;
    }

    // Right column
    const rightStartItem = pageItems[bestSplit];
    const rightNeedsContd = bestSplit < pageItems.length && rightStartItem && !rightStartItem.isCategory;
    if (rightNeedsContd) {
      pageColumns[1].contdCategory = currentCategory;
    }
    for (let i = bestSplit; i < pageItems.length; i++) {
      pageColumns[1].items.push(pageItems[i]);
      if (pageItems[i].isCategory) {
        currentCategory = pageItems[i].name;
      }
    }

    // Remove trailing orphan categories from right column
    while (pageColumns[1].items.length > 0 &&
           pageColumns[1].items[pageColumns[1].items.length - 1].isCategory) {
      pageColumns[1].items.pop();
    }

    // Calculate actual items used (excluding removed orphans)
    const itemsUsed = pageColumns[0].items.length + pageColumns[1].items.length;

    // Update currentCategory based on what's actually on the page
    currentCategory = undefined;
    for (const item of [...pageColumns[0].items, ...pageColumns[1].items]) {
      if (item.isCategory) {
        currentCategory = item.name;
      }
    }

    // Add page if it has content
    if (itemsUsed > 0) {
      pages.push({ columns: pageColumns, isFirstPage });
      itemIndex += itemsUsed;
    } else {
      // Safety: if no items used, move forward to prevent infinite loop
      itemIndex = localIndex;
    }

    isFirstPage = false;
  }

  return pages;
}

// Column component
function MenuColumn({ data, isFirstColumn }: { data: ColumnData; isFirstColumn: boolean }) {
  return (
    <View style={styles.column}>
      {/* Show "Cont'd" header if needed */}
      {data.contdCategory && (
        <View style={styles.categoryHeaderFirst}>
          <View style={styles.categoryLine} />
          <Text style={styles.categoryText}>{data.contdCategory} Cont'd</Text>
          <View style={styles.categoryLine} />
        </View>
      )}
      {data.items.map((item, index) => {
        if (item.isCategory) {
          const isFirst = index === 0 && !data.contdCategory && isFirstColumn;
          return (
            <View key={item.id} style={isFirst ? styles.categoryHeaderFirst : styles.categoryHeader}>
              <View style={styles.categoryLine} />
              <Text style={styles.categoryText}>{item.name}</Text>
              <View style={styles.categoryLine} />
            </View>
          );
        }
        return (
          <View key={item.id} style={styles.menuItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDots} />
            <Text style={styles.itemPrice}>{item.price}</Text>
          </View>
        );
      })}
    </View>
  );
}

// PDF Document Component
function MenuDocument({ displayItems, locationName, locationCity }: MenuPdfProps) {
  const pages = useMemo(() => paginateItems(displayItems), [displayItems]);

  return (
    <Document
      title={`The Catch Menu - ${locationName}`}
      author="The Catch"
      subject="Restaurant Menu"
    >
      {pages.map((page, pageIndex) => (
        <Page key={pageIndex} size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
          {/* Header - first page only */}
          {page.isFirstPage && (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>The Catch</Text>
              <Text style={styles.headerLocation}>{locationCity}</Text>
            </View>
          )}

          <View style={styles.content}>
            <MenuColumn data={page.columns[0]} isFirstColumn={true} />
            <MenuColumn data={page.columns[1]} isFirstColumn={false} />
          </View>

          {/* Page number */}
          {pages.length > 1 && (
            <Text style={styles.pageNumber}>
              {pageIndex + 1}
            </Text>
          )}
        </Page>
      ))}
    </Document>
  );
}

// Export the download button component
export default function MenuPdfDocument({ displayItems, locationName, locationCity }: MenuPdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = <MenuDocument displayItems={displayItems} locationName={locationName} locationCity={locationCity} />;
      const blob = await pdf(doc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `the-catch-menu-${locationCity.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        border: "none",
        borderRadius: "4px",
        fontFamily: "var(--font-menu-ui, system-ui, sans-serif)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: isGenerating ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        background: "#2B7A9B",
        color: "white",
        opacity: isGenerating ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {isGenerating ? (
        <>
          <span
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
}

// Export pagination function for use in preview
export { paginateItems };
export type { PageData, ColumnData };
