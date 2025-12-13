"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Location, MenuCategory, MenuItem } from "@/lib/types";
import styles from "./MenuDisplay.module.css";

interface Props {
  location: Location;
  categories: MenuCategory[];
  items: MenuItem[];
}

// Configuration: ~100 items across 2 screens = 50 items/screen
// 4 columns x 13 rows = 52 items per screen
const COLUMNS = 4;
const ROWS_PER_SCREEN = 13;
const ITEMS_PER_SCREEN = COLUMNS * ROWS_PER_SCREEN; // 52 items
const PAGE_ROTATION_INTERVAL = 12000; // 12 seconds per page

interface DisplayItem {
  id: string;
  name: string;
  price: string;
  isCategory?: boolean;
  categorySlug?: string; // Track which category each item belongs to
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "MKT";
  return price % 1 === 0 ? `${price}` : price.toFixed(2);
}

function getEffectivePrice(item: MenuItem, locationSlug: string): number | null {
  const override = item.locationOverrides?.[locationSlug];
  if (override?.price != null) return override.price;
  return item.price ?? null;
}

export default function MenuDisplayClient({ location, categories, items }: Props) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);

  // Build flat list of all menu items with category headers
  const displayItems = useMemo(() => {
    const result: DisplayItem[] = [];

    // Group items by category
    const itemsByCategory = categories.reduce((acc, cat) => {
      acc[cat.slug] = items.filter((item) => item.categorySlug === cat.slug);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Add items in category order with headers
    categories.forEach((category) => {
      const categoryItems = itemsByCategory[category.slug] || [];
      if (categoryItems.length === 0) return;

      // Add category header
      result.push({
        id: `cat-${category.slug}`,
        name: category.title,
        price: "",
        isCategory: true,
        categorySlug: category.slug
      });

      // Add items
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
  }, [categories, items, location.slug]);

  // Build paginated display with category header continuation
  const pages = useMemo(() => {
    const result: DisplayItem[][] = [];
    let currentIndex = 0;

    while (currentIndex < displayItems.length && result.length < 2) {
      const pageItems: DisplayItem[] = [];
      let itemsOnPage = 0;

      // If continuing a category from previous page, add continuation header
      if (currentIndex > 0) {
        const prevItem = displayItems[currentIndex - 1];
        const currentItem = displayItems[currentIndex];
        // If current item is not a header and belongs to same category as previous
        if (!currentItem?.isCategory && currentItem?.categorySlug === prevItem?.categorySlug) {
          // Find the category title
          const category = categories.find(c => c.slug === currentItem.categorySlug);
          if (category) {
            pageItems.push({
              id: `cat-cont-${category.slug}-page${result.length}`,
              name: category.title,
              price: "",
              isCategory: true,
              categorySlug: category.slug
            });
            itemsOnPage++;
          }
        }
      }

      // Fill the page
      while (itemsOnPage < ITEMS_PER_SCREEN && currentIndex < displayItems.length) {
        const item = displayItems[currentIndex];

        // Don't add orphaned category header at end of page
        if (item.isCategory && itemsOnPage === ITEMS_PER_SCREEN - 1) {
          break; // Leave this header for next page
        }

        pageItems.push(item);
        itemsOnPage++;
        currentIndex++;
      }

      if (pageItems.length > 0) {
        result.push(pageItems);
      }
    }

    return result;
  }, [displayItems, categories]);

  const totalPages = pages.length;

  // Auto-refresh page every 5 minutes to pick up menu changes
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [router]);

  // Auto-rotate pages if more than one page
  useEffect(() => {
    if (totalPages <= 1) return;
    const rotateTimer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, PAGE_ROTATION_INTERVAL);
    return () => clearInterval(rotateTimer);
  }, [totalPages]);

  // Get items for current page
  const pageItems = pages[currentPage] || [];

  // Distribute items across columns (fill columns top-to-bottom, left-to-right)
  const columns: DisplayItem[][] = Array.from({ length: COLUMNS }, () => []);
  pageItems.forEach((item, index) => {
    const columnIndex = Math.floor(index / ROWS_PER_SCREEN);
    if (columnIndex < COLUMNS) {
      columns[columnIndex].push(item);
    }
  });

  return (
    <div className={styles.container}>
      {/* Menu Content - 4 Columns with category headers */}
      <main className={styles.menuContent}>
        {columns.map((columnItems, colIndex) => (
          <div key={colIndex} className={styles.column}>
            {columnItems.map((item) => (
              item.isCategory ? (
                <div key={item.id} className={styles.categoryHeader}>
                  {item.name}
                </div>
              ) : (
                <div key={item.id} className={styles.menuItem}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemDots} />
                  <span className={styles.itemPrice}>{item.price}</span>
                </div>
              )
            ))}
          </div>
        ))}
      </main>

      {/* Minimal page indicator */}
      {totalPages > 1 && (
        <div className={styles.pageIndicator}>
          {currentPage + 1} / {totalPages}
        </div>
      )}
    </div>
  );
}
