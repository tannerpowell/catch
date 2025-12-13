"use client";

import { useState } from "react";
import styles from "./CategoryAnalysis.module.css";

interface CategoryLocationData {
  categorySlug: string;
  categoryTitle: string;
  locations: string[];
  itemCount: number;
  itemCountByLocation: Record<string, number>;
}

interface LocationCategoryData {
  locationSlug: string;
  locationName: string;
  categories: string[];
  uniqueCategories: string[];
  itemCount: number;
}

interface ItemAvailabilityStats {
  availableEverywhere: number;
  locationSpecific: number;
  noAvailability: number;
}

type ItemClassification =
  | "universal"
  | "universal-tweaked"
  | "multi-location"
  | "exclusive"
  | "hidden";

interface ItemAnalysisData {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryTitle: string;
  basePrice: number | null;
  image?: string;
  classification: ItemClassification;
  locationCount: number;
  locations: Array<{
    slug: string;
    name: string;
    price: number | null;
    hasPriceOverride: boolean;
  }>;
  priceRange: { min: number; max: number } | null;
  hasPriceVariation: boolean;
}

interface PropertyIssue {
  type: "missing-popular" | "exclusive-item" | "price-outlier" | "missing-category";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  itemId?: string;
  itemName?: string;
  categorySlug?: string;
  categoryTitle?: string;
  suggestedPrice?: number;
  currentPrice?: number;
  medianPrice?: number;
}

interface PropertyReport {
  locationSlug: string;
  locationName: string;
  itemCount: number;
  categoryCount: number;
  issues: PropertyIssue[];
  score: number;
}

interface UniversalMenuItem {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryTitle: string;
  image?: string;
  suggestedPrice: number | null;
  medianPrice: number | null;
  priceRange: { min: number; max: number } | null;
  currentCoverage: number;
  status: "core" | "recommended" | "consider" | "sunset";
  notes: string[];
}

interface UniversalMenuProposal {
  coreItems: UniversalMenuItem[];
  recommendedItems: UniversalMenuItem[];
  considerItems: UniversalMenuItem[];
  sunsetCandidates: UniversalMenuItem[];
  summary: {
    totalCoreItems: number;
    totalRecommended: number;
    totalConsider: number;
    totalSunset: number;
    estimatedUniversalMenuSize: number;
  };
}

// Proposed Menu types (opinionated, consolidated)
interface ProposedModifier {
  name: string;
  priceDelta: number;
}

interface ProposedMenuItem {
  id: string;
  originalIds: string[];
  name: string;
  description: string;
  categorySlug: string;
  categoryTitle: string;
  basePrice: number | null;
  modifiers: ProposedModifier[];
  annotations: string[];
  sourceItemCount: number;
  image?: string;
}

interface ProposedMenuCategory {
  slug: string;
  title: string;
  items: ProposedMenuItem[];
  itemCount: number;
}

interface ProposedMenu {
  categories: ProposedMenuCategory[];
  totalItems: number;
  totalRawItems: number;
  consolidationSavings: number;
  annotations: string[];
}

interface AnalysisData {
  categories: CategoryLocationData[];
  locations: LocationCategoryData[];
  items: ItemAnalysisData[];
  propertyReports: PropertyReport[];
  universalMenuProposal: UniversalMenuProposal;
  proposedMenu: ProposedMenu;
  sharedCategories: string[];
  universalCategories: string[];
  orphanCategories: string[];
  recommendations: string[];
  totalItems: number;
  totalCategories: number;
  totalLocations: number;
  itemAvailability: ItemAvailabilityStats;
  itemClassificationCounts: Record<ItemClassification, number>;
}

type ViewMode = "categories" | "items" | "properties" | "proposed";
type CategoryFilterMode = "all" | "shared" | "unique" | "orphan" | "universal";

/**
 * Render a client-side UI for exploring menu analysis across categories, items, properties, and a proposed universal menu.
 *
 * Displays an executive summary, view controls, filtered category grid, property reports, universal-menu item breakdowns (core / recommended / consider / sunset), a proposed menu by category, and an item detail modal driven by the provided analysis data.
 *
 * @param data - AnalysisData containing categories, locations, items, property reports, universal menu proposal, proposed menu, summary counts, and recommendations used to populate the UI.
 * @returns The React element tree for the CategoryAnalysisClient component.
 */
export default function CategoryAnalysisClient({ data }: { data: AnalysisData }) {
  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterMode>("all");
  const [selectedItem, setSelectedItem] = useState<UniversalMenuItem | null>(null);

  // Get full item analysis data for the selected item
  const selectedItemAnalysis = selectedItem
    ? data.items.find(i => i.id === selectedItem.id)
    : null;

  const filteredCategories = data.categories.filter(cat => {
    switch (categoryFilter) {
      case "shared":
        return cat.locations.length >= 2 && cat.locations.length < data.totalLocations;
      case "unique":
        return cat.locations.length === 1;
      case "orphan":
        return cat.locations.length === 0;
      case "universal":
        return cat.locations.length === data.totalLocations;
      default:
        return true;
    }
  });

  const getCategoryBadge = (cat: CategoryLocationData) => {
    if (cat.locations.length === 0) return { label: "Unused", type: "orphan" };
    if (cat.locations.length === data.totalLocations) return { label: "Universal", type: "universal" };
    if (cat.locations.length === 1) return { label: "Unique", type: "unique" };
    return { label: `${cat.locations.length} locations`, type: "shared" };
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "MP";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Operations</span>
          <h1 className={styles.title}>Menu Analysis</h1>
          <p className={styles.subtitle}>
            {data.totalItems} items across {data.totalLocations} locations
          </p>
        </header>

        {/* Executive Summary */}
        <section className={styles.summary}>
          <h2 className={styles.sectionTitle}>EXECUTIVE SUMMARY</h2>

          <div className={styles.statsRow}>
            <span className={styles.statsRowLabel}>Categories</span>
            <div className={styles.summaryGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.totalCategories}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.universalCategories.length}</span>
                <span className={styles.statLabel}>Universal</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.sharedCategories.length - data.universalCategories.length}</span>
                <span className={styles.statLabel}>Shared</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.categories.filter(c => c.locations.length === 1).length}</span>
                <span className={styles.statLabel}>Unique</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.orphanCategories.length}</span>
                <span className={styles.statLabel}>Unused</span>
              </div>
            </div>
          </div>

          <div className={styles.statsRow}>
            <span className={styles.statsRowLabel}>Items ({data.totalItems})</span>
            <div className={styles.summaryGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.itemAvailability.availableEverywhere}</span>
                <span className={styles.statLabel}>Available Everywhere</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.itemAvailability.locationSpecific}</span>
                <span className={styles.statLabel}>Location-Specific</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{data.itemAvailability.noAvailability}</span>
                <span className={styles.statLabel}>Hidden (no availability)</span>
              </div>
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h3 className={styles.recommendationsTitle}>Recommendations</h3>
              <ul className={styles.recommendationsList}>
                {data.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* View Toggle */}
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${viewMode === "categories" ? styles.active : ""}`}
              onClick={() => setViewMode("categories")}
            >
              Categories
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === "items" ? styles.active : ""}`}
              onClick={() => setViewMode("items")}
            >
              Items
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === "properties" ? styles.active : ""}`}
              onClick={() => setViewMode("properties")}
            >
              Properties
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === "proposed" ? styles.active : ""}`}
              onClick={() => setViewMode("proposed")}
            >
              Universal Menu
            </button>
          </div>

          {viewMode === "categories" && (
            <div className={styles.filterTabs}>
              {[
                { mode: "all" as CategoryFilterMode, label: "All" },
                { mode: "universal" as CategoryFilterMode, label: "Universal" },
                { mode: "shared" as CategoryFilterMode, label: "Shared" },
                { mode: "unique" as CategoryFilterMode, label: "Unique" },
                { mode: "orphan" as CategoryFilterMode, label: "Unused" },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  className={`${styles.filterTab} ${categoryFilter === mode ? styles.active : ""}`}
                  onClick={() => setCategoryFilter(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category View */}
        {viewMode === "categories" && (
          <section className={styles.dataSection}>
            <div className={styles.categoryGrid}>
              {filteredCategories.map(cat => {
                const badge = getCategoryBadge(cat);
                return (
                  <div key={cat.categorySlug} className={styles.categoryCard}>
                    <div className={styles.categoryHeader}>
                      <span className={styles.categoryName}>{cat.categoryTitle}</span>
                      <span className={`${styles.badge} ${styles[badge.type]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className={styles.categoryMeta}>
                      <span>{cat.itemCount} items total</span>
                    </div>
                    {cat.locations.length > 0 && (
                      <div className={styles.locationTags}>
                        {cat.locations.map(loc => {
                          const locData = data.locations.find(l => l.locationSlug === loc);
                          const count = cat.itemCountByLocation[loc] || 0;
                          return (
                            <span key={loc} className={styles.locationTag}>
                              {locData?.locationName || loc}
                              <span className={styles.tagCount}>{count}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Properties View */}
        {viewMode === "properties" && (
          <section className={styles.dataSection}>
            <div className={styles.propertiesGrid}>
              {data.propertyReports
                .sort((a, b) => a.score - b.score) // Worst first
                .map(report => (
                <div key={report.locationSlug} className={styles.propertyCard}>
                  <div className={styles.propertyHeader}>
                    <div className={styles.propertyInfo}>
                      <span className={styles.propertyName}>{report.locationName}</span>
                      <span className={styles.propertyStats}>
                        {report.itemCount} items · {report.categoryCount} categories
                      </span>
                    </div>
                    <div className={`${styles.scoreRing} ${report.score >= 80 ? styles.good : report.score >= 50 ? styles.ok : styles.poor}`}>
                      <span className={styles.scoreValue}>{report.score}</span>
                    </div>
                  </div>

                  {report.issues.length === 0 ? (
                    <div className={styles.noIssues}>✓ Fully aligned with universal menu</div>
                  ) : (
                    <div className={styles.issuesList}>
                      {report.issues.slice(0, 8).map((issue, i) => (
                        <div key={i} className={`${styles.issue} ${styles[issue.severity]}`}>
                          <span className={styles.issueIcon}>
                            {issue.type === "missing-popular" && "⊘"}
                            {issue.type === "exclusive-item" && "★"}
                            {issue.type === "price-outlier" && "$"}
                            {issue.type === "missing-category" && "◇"}
                          </span>
                          <div className={styles.issueContent}>
                            <span className={styles.issueTitle}>{issue.title}</span>
                            <span className={styles.issueDesc}>{issue.description}</span>
                          </div>
                        </div>
                      ))}
                      {report.issues.length > 8 && (
                        <div className={styles.moreIssues}>
                          +{report.issues.length - 8} more issues
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Items View (Core/Recommended/Consider/Sunset breakdown) */}
        {viewMode === "items" && (
          <section className={styles.dataSection}>
            {/* Summary */}
            <div className={styles.universalSummary}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>{data.universalMenuProposal.summary.totalCoreItems}</span>
                <span className={styles.summaryLabel}>Core Items</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>+{data.universalMenuProposal.summary.totalRecommended}</span>
                <span className={styles.summaryLabel}>Recommended</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>{data.universalMenuProposal.summary.totalConsider}</span>
                <span className={styles.summaryLabel}>Consider</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>{data.universalMenuProposal.summary.totalSunset}</span>
                <span className={styles.summaryLabel}>Sunset</span>
              </div>
              <div className={styles.summaryCard + " " + styles.highlight}>
                <span className={styles.summaryNumber}>{data.universalMenuProposal.summary.estimatedUniversalMenuSize}</span>
                <span className={styles.summaryLabel}>Est. Menu Size</span>
              </div>
            </div>

            {/* Core Items */}
            {data.universalMenuProposal.coreItems.length > 0 && (
              <div className={styles.menuSection}>
                <h3 className={styles.menuSectionTitle}>
                  <span className={styles.menuSectionIcon}>✓</span>
                  Core Items
                  <span className={styles.menuSectionCount}>{data.universalMenuProposal.coreItems.length}</span>
                </h3>
                <p className={styles.menuSectionDesc}>Already available at all locations. These form the foundation.</p>
                <div className={styles.menuItemsGrid}>
                  {data.universalMenuProposal.coreItems.map(item => (
                    <div
                      key={item.id}
                      className={`${styles.menuItem} ${styles.core} ${styles.clickable}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className={styles.menuItemName}>{item.name}</span>
                      <div className={styles.menuItemFooter}>
                        <span className={styles.menuItemCategory}>{item.categoryTitle}</span>
                        <span className={styles.menuItemPrice}>
                          {item.suggestedPrice ? `$${item.suggestedPrice.toFixed(2)}` : "MP"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended */}
            {data.universalMenuProposal.recommendedItems.length > 0 && (
              <div className={styles.menuSection}>
                <h3 className={styles.menuSectionTitle}>
                  <span className={styles.menuSectionIcon}>↑</span>
                  Recommended Additions
                  <span className={styles.menuSectionCount}>{data.universalMenuProposal.recommendedItems.length}</span>
                </h3>
                <p className={styles.menuSectionDesc}>At 80%+ locations. Ready to roll out everywhere.</p>
                <div className={styles.menuItemsGrid}>
                  {data.universalMenuProposal.recommendedItems.map(item => (
                    <div
                      key={item.id}
                      className={`${styles.menuItem} ${styles.recommended} ${styles.clickable}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className={styles.menuItemName}>{item.name}</span>
                      <div className={styles.menuItemFooter}>
                        <span className={styles.menuItemCoverage}>
                          {item.currentCoverage}/{data.totalLocations} locations
                        </span>
                        <span className={styles.menuItemPrice}>
                          {item.suggestedPrice ? `$${item.suggestedPrice.toFixed(2)}` : "MP"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consider - grouped by category */}
            {data.universalMenuProposal.considerItems.length > 0 && (() => {
              // Group consider items by category
              const byCategory = data.universalMenuProposal.considerItems.reduce((acc, item) => {
                if (!acc[item.categoryTitle]) acc[item.categoryTitle] = [];
                acc[item.categoryTitle].push(item);
                return acc;
              }, {} as Record<string, typeof data.universalMenuProposal.considerItems>);

              const sortedCategories = Object.keys(byCategory).sort();

              return (
                <div className={styles.menuSection}>
                  <h3 className={styles.menuSectionTitle}>
                    <span className={styles.menuSectionIcon}>?</span>
                    Consider
                    <span className={styles.menuSectionCount}>{data.universalMenuProposal.considerItems.length}</span>
                  </h3>
                  <p className={styles.menuSectionDesc}>At 50-79% locations. Evaluate before including.</p>

                  {sortedCategories.map(catTitle => (
                    <div key={catTitle} className={styles.considerCategory}>
                      <h4 className={styles.considerCategoryTitle}>{catTitle}</h4>
                      <div className={styles.menuItemsGrid}>
                        {byCategory[catTitle]
                          .sort((a, b) => b.currentCoverage - a.currentCoverage)
                          .map(item => (
                          <div
                            key={item.id}
                            className={`${styles.menuItem} ${styles.consider} ${styles.clickable}`}
                            onClick={() => setSelectedItem(item)}
                          >
                            <span className={styles.menuItemName}>{item.name}</span>
                            <div className={styles.menuItemFooter}>
                              <span className={styles.menuItemCoverage}>
                                {item.currentCoverage}/{data.totalLocations} locations
                              </span>
                              <span className={styles.menuItemPrice}>
                                {item.suggestedPrice ? `$${item.suggestedPrice.toFixed(2)}` : "MP"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Sunset */}
            {data.universalMenuProposal.sunsetCandidates.length > 0 && (
              <div className={styles.menuSection}>
                <h3 className={styles.menuSectionTitle}>
                  <span className={styles.menuSectionIcon}>↓</span>
                  Sunset Candidates
                  <span className={styles.menuSectionCount}>{data.universalMenuProposal.sunsetCandidates.length}</span>
                </h3>
                <p className={styles.menuSectionDesc}>Exclusive to one location. Consider removing or expanding.</p>
                <div className={styles.menuItemsGrid}>
                  {data.universalMenuProposal.sunsetCandidates.map(item => (
                    <div
                      key={item.id}
                      className={`${styles.menuItem} ${styles.sunset} ${styles.clickable}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className={styles.menuItemName}>{item.name}</span>
                      {item.notes.length > 0 && (
                        <span className={styles.menuItemNotes}>{item.notes[0]}</span>
                      )}
                      <div className={styles.menuItemFooter}>
                        <span className={styles.menuItemCategory}>{item.categoryTitle}</span>
                        <span className={styles.menuItemPrice}>
                          {item.suggestedPrice ? `$${item.suggestedPrice.toFixed(2)}` : "MP"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Proposed Universal Menu View */}
        {viewMode === "proposed" && (
          <section className={styles.dataSection}>
            {/* Summary Stats */}
            <div className={styles.proposedSummary}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>{data.proposedMenu.totalItems}</span>
                <span className={styles.summaryLabel}>Menu Items</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryNumber}>{data.proposedMenu.categories.length}</span>
                <span className={styles.summaryLabel}>Categories</span>
              </div>
              {data.proposedMenu.consolidationSavings > 0 && (
                <div className={styles.summaryCard + " " + styles.highlight}>
                  <span className={styles.summaryNumber}>-{data.proposedMenu.consolidationSavings}</span>
                  <span className={styles.summaryLabel}>Consolidated</span>
                </div>
              )}
            </div>

            {/* Global Annotations */}
            <div className={styles.proposedAnnotations}>
              {data.proposedMenu.annotations.map((note, i) => (
                <span key={i} className={styles.annotationTag}>{note}</span>
              ))}
            </div>

            {/* Menu by Category */}
            {data.proposedMenu.categories.map(category => (
              <div key={category.slug} className={styles.proposedCategory}>
                <h3 className={styles.proposedCategoryTitle}>
                  {category.title}
                  <span className={styles.proposedCategoryCount}>{category.itemCount}</span>
                </h3>
                <div className={styles.proposedItemsGrid}>
                  {category.items.map(item => (
                    <div
                      key={item.id}
                      className={`${styles.proposedItem} ${item.modifiers.length > 0 ? styles.hasModifiers : ''} ${item.annotations.length > 0 ? styles.hasAnnotations : ''}`}
                    >
                      <div className={styles.proposedItemMain}>
                        <span className={styles.proposedItemName}>{item.name}</span>
                        <span className={styles.proposedItemPrice}>
                          {item.basePrice !== null ? `$${item.basePrice.toFixed(2)}` : 'MP'}
                        </span>
                      </div>
                      {item.description && (
                        <p className={styles.proposedItemDesc}>{item.description}</p>
                      )}
                      {item.modifiers.length > 0 && (
                        <div className={styles.proposedModifiers}>
                          {item.modifiers.map((mod, i) => (
                            <span key={i} className={styles.modifier}>
                              {mod.name}: {mod.priceDelta >= 0 ? '+' : ''}${mod.priceDelta.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.annotations.length > 0 && (
                        <div className={styles.proposedItemAnnotations}>
                          {item.annotations.map((note, i) => (
                            <span key={i} className={styles.itemAnnotation}>{note}</span>
                          ))}
                        </div>
                      )}
                      {item.sourceItemCount > 1 && (
                        <span className={styles.consolidatedBadge}>
                          Consolidated from {item.sourceItemCount} items
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && selectedItemAnalysis && (
        <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedItem(null)}>
              ×
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <h2 className={styles.modalTitle}>{selectedItem.name}</h2>
                <span className={`${styles.statusBadge} ${styles[selectedItem.status]}`}>
                  {selectedItem.status}
                </span>
              </div>
              <span className={styles.modalCategory}>{selectedItem.categoryTitle}</span>
              <div className={styles.modalPricing}>
                {selectedItem.suggestedPrice !== null ? (
                  <span className={styles.modalPrice}>${selectedItem.suggestedPrice.toFixed(2)}</span>
                ) : (
                  <span className={styles.modalPrice}>Market Price</span>
                )}
                {selectedItem.priceRange && selectedItem.priceRange.min !== selectedItem.priceRange.max && (
                  <span className={styles.modalPriceRange}>
                    Range: ${selectedItem.priceRange.min.toFixed(2)} – ${selectedItem.priceRange.max.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.locationAvailability}>
                <h3 className={styles.availabilityTitle}>
                  Location Availability
                  <span className={styles.availabilityCount}>
                    {selectedItemAnalysis.locationCount}/{data.totalLocations}
                  </span>
                </h3>
                <div className={styles.locationGrid}>
                  {data.locations.map(loc => {
                    const itemLoc = selectedItemAnalysis.locations.find(l => l.slug === loc.locationSlug);
                    const isAvailable = !!itemLoc;

                    return (
                      <div
                        key={loc.locationSlug}
                        className={`${styles.locationAvailItem} ${isAvailable ? styles.available : styles.unavailable}`}
                      >
                        <span className={styles.locationAvailIcon}>
                          {isAvailable ? "✓" : "×"}
                        </span>
                        <div className={styles.locationAvailInfo}>
                          <span className={styles.locationAvailName}>{loc.locationName}</span>
                          {isAvailable && itemLoc && (
                            <span className={styles.locationAvailPrice}>
                              {itemLoc.price !== null ? `$${itemLoc.price.toFixed(2)}` : "MP"}
                              {itemLoc.hasPriceOverride && <span className={styles.overrideIndicator}>*</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItem.notes.length > 0 && (
                <div className={styles.modalNotes}>
                  <h4>Notes</h4>
                  <ul>
                    {selectedItem.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}