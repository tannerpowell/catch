import { getBrand } from "@/lib/brand";
import type { Metadata } from "next";
import CategoryAnalysisClient from "./CategoryAnalysisClient";
import { isItemAvailableAtLocation } from "@/lib/utils/menuAvailability";

export const metadata: Metadata = {
  title: "Menu Analysis",
  description: "Analyze menu items and categories across locations",
  robots: { index: false, follow: false }
};

export const revalidate = 300;

interface CategoryLocationData {
  categorySlug: string;
  categoryTitle: string;
  locations: string[]; // Location slugs where this category has items
  itemCount: number;
  itemCountByLocation: Record<string, number>;
}

interface LocationCategoryData {
  locationSlug: string;
  locationName: string;
  categories: string[]; // Category slugs used at this location
  uniqueCategories: string[]; // Categories only used at this location
  itemCount: number;
}

interface ItemAvailabilityStats {
  availableEverywhere: number;
  locationSpecific: number;
  noAvailability: number;
}

type ItemClassification =
  | "universal"           // availableEverywhere=true OR available at all locations, same price
  | "universal-tweaked"   // available at all locations, but with price variations
  | "multi-location"      // available at 2+ but not all locations
  | "exclusive"           // only at 1 location
  | "hidden";             // no availability set

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

// Property Report - issues for a specific location
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
  score: number; // 0-100, higher = more aligned with universal menu
}

// Universal Menu Proposal
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
  currentCoverage: number; // How many locations have it
  status: "core" | "recommended" | "consider" | "sunset";
  notes: string[];
}

interface UniversalMenuProposal {
  coreItems: UniversalMenuItem[];        // Already universal
  recommendedItems: UniversalMenuItem[]; // At 80%+ locations
  considerItems: UniversalMenuItem[];    // At 50-79% locations
  sunsetCandidates: UniversalMenuItem[]; // Exclusive items to potentially remove
  summary: {
    totalCoreItems: number;
    totalRecommended: number;
    totalConsider: number;
    totalSunset: number;
    estimatedUniversalMenuSize: number;
  };
}

// ============================================================================
// PROPOSED MENU - Opinionated, Consolidated Universal Menu
// ============================================================================

interface ProposedModifier {
  name: string;           // e.g., "Large"
  priceDelta: number;     // e.g., 3.00 (added to base price)
}

interface ProposedMenuItem {
  id: string;
  originalIds: string[];  // Source item IDs that were consolidated
  name: string;           // Clean name (no numbers, proper formatting)
  description: string;    // Numbers spelled out, quantity info here
  categorySlug: string;
  categoryTitle: string;
  basePrice: number | null;
  modifiers: ProposedModifier[];
  annotations: string[];  // Explanations for consolidation decisions
  sourceItemCount: number; // How many raw items this consolidates
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
  totalRawItems: number;     // Original item count before consolidation
  consolidationSavings: number; // How many items removed via consolidation
  annotations: string[];     // Global annotations
}

interface AnalysisData {
  categories: CategoryLocationData[];
  locations: LocationCategoryData[];
  items: ItemAnalysisData[];
  propertyReports: PropertyReport[];
  universalMenuProposal: UniversalMenuProposal;
  proposedMenu: ProposedMenu;
  sharedCategories: string[]; // Categories used at 2+ locations
  universalCategories: string[]; // Categories used at ALL locations
  orphanCategories: string[]; // Categories with no items at any location
  recommendations: string[];
  totalItems: number;
  totalCategories: number;
  totalLocations: number;
  itemAvailability: ItemAvailabilityStats;
  itemClassificationCounts: Record<ItemClassification, number>;
}

/**
 * Generates a comprehensive analysis of a brand's menu, categories, and locations and renders a client with that analysis.
 *
 * Builds analytics including category-location coverage, per-location property reports and alignment scores, item availability and classification, universal menu recommendations, and a proposed consolidated menu, then renders CategoryAnalysisClient with the assembled AnalysisData.
 *
 * @returns A React element that renders CategoryAnalysisClient populated with the computed AnalysisData
 */
export default async function CategoryAnalysisPage() {
  const brand = getBrand();

  const [locations, categories, items] = await Promise.all([
    brand.getLocations(),
    brand.getCategories(),
    brand.getItems()
  ]);

  // Build category -> locations map
  const categoryLocationMap = new Map<string, Set<string>>();
  const categoryItemCountByLocation = new Map<string, Map<string, number>>();

  // Initialize all categories
  categories.forEach(cat => {
    categoryLocationMap.set(cat.slug, new Set());
    categoryItemCountByLocation.set(cat.slug, new Map());
  });

  // For each location, find which categories have available items
  locations.forEach(location => {
    items.forEach(item => {
      if (isItemAvailableAtLocation(item, location.slug)) {
        const catSet = categoryLocationMap.get(item.categorySlug);
        if (catSet) {
          catSet.add(location.slug);
        }

        const countMap = categoryItemCountByLocation.get(item.categorySlug);
        if (countMap) {
          countMap.set(location.slug, (countMap.get(location.slug) || 0) + 1);
        }
      }
    });
  });

  // Build category data
  const categoryData: CategoryLocationData[] = categories.map(cat => {
    const locs = Array.from(categoryLocationMap.get(cat.slug) || []);
    const countMap = categoryItemCountByLocation.get(cat.slug) || new Map();
    const itemCountByLocation: Record<string, number> = {};
    countMap.forEach((count, loc) => {
      itemCountByLocation[loc] = count;
    });

    return {
      categorySlug: cat.slug,
      categoryTitle: cat.title,
      locations: locs,
      itemCount: items.filter(i => i.categorySlug === cat.slug).length,
      itemCountByLocation
    };
  });

  // Build location data
  const locationData: LocationCategoryData[] = locations.map(loc => {
    const catsAtLocation = new Set<string>();
    items.forEach(item => {
      if (isItemAvailableAtLocation(item, loc.slug)) {
        catsAtLocation.add(item.categorySlug);
      }
    });

    const catsArray = Array.from(catsAtLocation);

    // Find unique categories (only at this location)
    const uniqueCats = catsArray.filter(catSlug => {
      const catLocs = categoryLocationMap.get(catSlug);
      return catLocs && catLocs.size === 1 && catLocs.has(loc.slug);
    });

    return {
      locationSlug: loc.slug,
      locationName: loc.name.replace(/^The Catch\s*[—–-]\s*/i, ""),
      categories: catsArray,
      uniqueCategories: uniqueCats,
      itemCount: items.filter(i => isItemAvailableAtLocation(i, loc.slug)).length
    };
  });

  // Categorize categories by usage
  const sharedCategories = categoryData
    .filter(c => c.locations.length >= 2)
    .map(c => c.categorySlug);

  const universalCategories = categoryData
    .filter(c => c.locations.length === locations.length)
    .map(c => c.categorySlug);

  const orphanCategories = categoryData
    .filter(c => c.locations.length === 0)
    .map(c => c.categorySlug);

  // Generate recommendations
  const recommendations: string[] = [];

  if (orphanCategories.length > 0) {
    recommendations.push(
      `Remove ${orphanCategories.length} unused categor${orphanCategories.length === 1 ? 'y' : 'ies'}: ${orphanCategories.map(s => categories.find(c => c.slug === s)?.title).join(", ")}`
    );
  }

  // Find categories with very similar names that might be duplicates
  const categoryTitles = categories.map(c => ({ slug: c.slug, title: c.title.toLowerCase() }));
  const potentialDupes: string[][] = [];

  categoryTitles.forEach((cat, i) => {
    categoryTitles.slice(i + 1).forEach(other => {
      // Check for similar names
      if (cat.title.includes(other.title) || other.title.includes(cat.title) ||
          levenshteinDistance(cat.title, other.title) <= 2) {
        potentialDupes.push([cat.slug, other.slug]);
      }
    });
  });

  potentialDupes.forEach(([a, b]) => {
    const catA = categories.find(c => c.slug === a);
    const catB = categories.find(c => c.slug === b);
    if (catA && catB) {
      recommendations.push(`Review potential duplicates: "${catA.title}" and "${catB.title}"`);
    }
  });

  // Find locations with unique categories that might need consolidation
  locationData.forEach(loc => {
    if (loc.uniqueCategories.length > 0) {
      const uniqueTitles = loc.uniqueCategories
        .map(s => categories.find(c => c.slug === s)?.title)
        .filter(Boolean);
      if (uniqueTitles.length > 0) {
        recommendations.push(
          `${loc.locationName} has ${uniqueTitles.length} unique categor${uniqueTitles.length === 1 ? 'y' : 'ies'}: ${uniqueTitles.join(", ")}`
        );
      }
    }
  });

  // Find items that should be modifiers (size/quantity variants of same item)
  const sizePatterns = [
    /^(sm|small|med|medium|lg|lrg|large|half|full|single|double|kid'?s?)\s+/i,
    /\s+(sm|small|med|medium|lg|lrg|large|half|full|single|double)\s*$/i,
    /^(\d+)\s*(?:pc|piece|oz)\.?\s+/i,
    /\s+(\d+)\s*(?:pc|piece|oz)\.?\s*$/i,
  ];

  const normalizeItemName = (name: string): string => {
    let normalized = name.toLowerCase().trim();
    sizePatterns.forEach(pattern => {
      normalized = normalized.replace(pattern, '');
    });
    return normalized.trim();
  };

  // Group items by normalized name
  const itemsByNormalizedName = new Map<string, typeof items>();
  items.forEach(item => {
    const normalized = normalizeItemName(item.name);
    if (!itemsByNormalizedName.has(normalized)) {
      itemsByNormalizedName.set(normalized, []);
    }
    itemsByNormalizedName.get(normalized)!.push(item);
  });

  // Find groups with 2+ items (potential modifier candidates)
  const modifierCandidates: Array<{ baseName: string; variants: string[] }> = [];
  itemsByNormalizedName.forEach((variantItems, normalizedName) => {
    if (variantItems.length >= 2 && normalizedName.length > 3) {
      // Check if the items actually have size/quantity prefixes or suffixes
      const hasVariants = variantItems.some(item =>
        sizePatterns.some(p => p.test(item.name))
      );
      if (hasVariants) {
        modifierCandidates.push({
          baseName: normalizedName,
          variants: variantItems.map(i => i.name).sort()
        });
      }
    }
  });

  // Add recommendations for modifier candidates (limit to top 5 to avoid spam)
  modifierCandidates.slice(0, 5).forEach(({ variants }) => {
    recommendations.push(
      `Consider modifiers instead of separate items: ${variants.join(", ")}`
    );
  });

  if (modifierCandidates.length > 5) {
    recommendations.push(
      `...and ${modifierCandidates.length - 5} more item groups that could use size/quantity modifiers`
    );
  }

  // Calculate item availability breakdown
  const itemAvailability: ItemAvailabilityStats = {
    availableEverywhere: items.filter(i => i.availableEverywhere === true).length,
    locationSpecific: items.filter(i =>
      !i.availableEverywhere &&
      i.locationOverrides &&
      Object.values(i.locationOverrides).some(o => o.available === true)
    ).length,
    noAvailability: items.filter(i =>
      !i.availableEverywhere &&
      (!i.locationOverrides || !Object.values(i.locationOverrides).some(o => o.available === true))
    ).length
  };

  // Build detailed item analysis
  const itemAnalysis: ItemAnalysisData[] = items.map(item => {
    const category = categories.find(c => c.slug === item.categorySlug);

    // Find all locations where this item is available
    const availableLocations: ItemAnalysisData["locations"] = [];

    locations.forEach(loc => {
      if (isItemAvailableAtLocation(item, loc.slug)) {
        const override = item.locationOverrides?.[loc.slug];
        const effectivePrice = override?.price ?? item.price ?? null;
        availableLocations.push({
          slug: loc.slug,
          name: loc.name.replace(/^The Catch\s*[—–-]\s*/i, ""),
          price: effectivePrice,
          hasPriceOverride: override?.price !== undefined
        });
      }
    });

    // Calculate price range and variation
    const prices = availableLocations
      .map(l => l.price)
      .filter((p): p is number => p !== null);

    const priceRange = prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null;

    const hasPriceVariation = priceRange !== null && priceRange.min !== priceRange.max;

    // Classify the item
    let classification: ItemClassification;

    if (availableLocations.length === 0) {
      classification = "hidden";
    } else if (item.availableEverywhere === true) {
      classification = hasPriceVariation ? "universal-tweaked" : "universal";
    } else if (availableLocations.length === locations.length) {
      classification = hasPriceVariation ? "universal-tweaked" : "universal";
    } else if (availableLocations.length === 1) {
      classification = "exclusive";
    } else {
      classification = "multi-location";
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      categorySlug: item.categorySlug,
      categoryTitle: category?.title ?? item.categorySlug,
      basePrice: item.price ?? null,
      image: item.image,
      classification,
      locationCount: availableLocations.length,
      locations: availableLocations,
      priceRange,
      hasPriceVariation
    };
  });

  // Count items by classification
  const itemClassificationCounts: Record<ItemClassification, number> = {
    universal: 0,
    "universal-tweaked": 0,
    "multi-location": 0,
    exclusive: 0,
    hidden: 0
  };

  itemAnalysis.forEach(item => {
    itemClassificationCounts[item.classification]++;
  });

  // Helper: calculate median
  const median = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Build item price medians for outlier detection
  const itemPriceMedians = new Map<string, number>();
  itemAnalysis.forEach(item => {
    const prices = item.locations.map(l => l.price).filter((p): p is number => p !== null);
    if (prices.length > 0) {
      itemPriceMedians.set(item.id, median(prices));
    }
  });

  // Determine "popular" threshold (80% of locations)
  const popularThreshold = Math.ceil(locations.length * 0.8);
  const considerThreshold = Math.ceil(locations.length * 0.5);

  // Items that are at 80%+ locations (candidates for universal)
  const popularItems = itemAnalysis.filter(i =>
    i.locationCount >= popularThreshold && i.classification !== "hidden"
  );

  // Categories that are at 80%+ locations
  const popularCategories = categoryData.filter(c =>
    c.locations.length >= popularThreshold
  );

  // === BUILD PROPERTY REPORTS ===
  const propertyReports: PropertyReport[] = locations.map(loc => {
    const locName = loc.name.replace(/^The Catch\s*[—–-]\s*/i, "");
    const issues: PropertyIssue[] = [];

    // Get items at this location
    const itemsAtLocation = new Set(
      itemAnalysis.filter(i => i.locations.some(l => l.slug === loc.slug)).map(i => i.id)
    );
    const catsAtLocation = new Set(
      locationData.find(l => l.locationSlug === loc.slug)?.categories || []
    );

    // 1. Missing popular items (at 80%+ other locations but not here) - LOW severity
    popularItems.forEach(item => {
      if (!itemsAtLocation.has(item.id)) {
        issues.push({
          type: "missing-popular",
          severity: "low",
          title: `Missing: ${item.name}`,
          description: `Available at ${item.locationCount}/${locations.length} locations`,
          itemId: item.id,
          itemName: item.name,
          categorySlug: item.categorySlug,
          categoryTitle: item.categoryTitle,
          medianPrice: itemPriceMedians.get(item.id)
        });
      }
    });

    // 2. Exclusive items (only at this location) - HIGH severity, these create friction
    itemAnalysis
      .filter(i => i.classification === "exclusive" && i.locations[0]?.slug === loc.slug)
      .forEach(item => {
        issues.push({
          type: "exclusive-item",
          severity: "high",
          title: `Exclusive: ${item.name}`,
          description: `Only offered here. Consider expanding or removing.`,
          itemId: item.id,
          itemName: item.name,
          categorySlug: item.categorySlug,
          categoryTitle: item.categoryTitle,
          currentPrice: item.locations[0]?.price ?? undefined
        });
      });

    // 3. Price outliers (>20% from median)
    itemAnalysis
      .filter(i => i.locations.some(l => l.slug === loc.slug))
      .forEach(item => {
        const locPrice = item.locations.find(l => l.slug === loc.slug)?.price;
        const medianPrice = itemPriceMedians.get(item.id);
        if (locPrice && medianPrice && medianPrice > 0) {
          const deviation = Math.abs(locPrice - medianPrice) / medianPrice;
          if (deviation > 0.2) {
            const direction = locPrice > medianPrice ? "above" : "below";
            issues.push({
              type: "price-outlier",
              severity: deviation > 0.5 ? "high" : "medium",
              title: `Price: ${item.name}`,
              description: `$${locPrice.toFixed(2)} is ${Math.round(deviation * 100)}% ${direction} median ($${medianPrice.toFixed(2)})`,
              itemId: item.id,
              itemName: item.name,
              currentPrice: locPrice,
              medianPrice,
              suggestedPrice: medianPrice
            });
          }
        }
      });

    // 4. Missing popular categories
    popularCategories.forEach(cat => {
      if (!catsAtLocation.has(cat.categorySlug)) {
        issues.push({
          type: "missing-category",
          severity: cat.locations.length >= locations.length - 1 ? "high" : "medium",
          title: `Missing category: ${cat.categoryTitle}`,
          description: `Used at ${cat.locations.length}/${locations.length} locations`,
          categorySlug: cat.categorySlug,
          categoryTitle: cat.categoryTitle
        });
      }
    });

    // Calculate alignment score (100 = perfect alignment with universal menu)
    // EXCLUSIVE items are the main penalty - these create friction for standardization
    // Missing items get a light penalty - still want coverage but not as critical
    const exclusiveCount = issues.filter(i => i.type === "exclusive-item").length;
    const missingPopularCount = issues.filter(i => i.type === "missing-popular").length;
    const priceOutlierCount = issues.filter(i => i.type === "price-outlier").length;

    // Score: start at 100, subtract penalties
    const exclusivePenalty = exclusiveCount * 8;      // Heavy: each exclusive item costs 8 points
    const missingPenalty = missingPopularCount * 1;   // Light: each missing popular item costs 1 point
    const pricePenalty = priceOutlierCount * 2;       // Medium: each price outlier costs 2 points
    const score = Math.max(0, Math.round(100 - exclusivePenalty - missingPenalty - pricePenalty));

    return {
      locationSlug: loc.slug,
      locationName: locName,
      itemCount: itemsAtLocation.size,
      categoryCount: catsAtLocation.size,
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      score
    };
  });

  // === BUILD UNIVERSAL MENU PROPOSAL ===
  const buildUniversalMenuItem = (item: ItemAnalysisData, status: UniversalMenuItem["status"]): UniversalMenuItem => {
    const prices = item.locations.map(l => l.price).filter((p): p is number => p !== null);
    const medianPrice = prices.length > 0 ? median(prices) : null;
    const notes: string[] = [];

    if (item.hasPriceVariation && item.priceRange) {
      notes.push(`Price varies: $${item.priceRange.min.toFixed(2)}–$${item.priceRange.max.toFixed(2)}`);
    }
    if (status === "recommended") {
      notes.push(`At ${item.locationCount}/${locations.length} locations`);
    }
    if (status === "sunset" && item.locations.length > 0) {
      notes.push(`Only at ${item.locations.map(l => l.name).join(", ")}`);
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      categorySlug: item.categorySlug,
      categoryTitle: item.categoryTitle,
      image: item.image,
      suggestedPrice: medianPrice,
      medianPrice,
      priceRange: item.priceRange,
      currentCoverage: item.locationCount,
      status,
      notes
    };
  };

  // Core items: already universal or availableEverywhere
  const coreItems = itemAnalysis
    .filter(i => i.classification === "universal" || i.classification === "universal-tweaked")
    .map(i => buildUniversalMenuItem(i, "core"))
    .sort((a, b) => a.categoryTitle.localeCompare(b.categoryTitle) || a.name.localeCompare(b.name));

  // Recommended: at 80%+ locations but not universal yet
  const recommendedItems = itemAnalysis
    .filter(i =>
      i.classification === "multi-location" &&
      i.locationCount >= popularThreshold
    )
    .map(i => buildUniversalMenuItem(i, "recommended"))
    .sort((a, b) => b.currentCoverage - a.currentCoverage);

  // Consider: at 50-79% locations
  const considerItems = itemAnalysis
    .filter(i =>
      i.classification === "multi-location" &&
      i.locationCount >= considerThreshold &&
      i.locationCount < popularThreshold
    )
    .map(i => buildUniversalMenuItem(i, "consider"))
    .sort((a, b) => b.currentCoverage - a.currentCoverage);

  // Sunset candidates: exclusive items (only at 1 location)
  const sunsetCandidates = itemAnalysis
    .filter(i => i.classification === "exclusive")
    .map(i => buildUniversalMenuItem(i, "sunset"))
    .sort((a, b) => a.categoryTitle.localeCompare(b.categoryTitle) || a.name.localeCompare(b.name));

  const universalMenuProposal: UniversalMenuProposal = {
    coreItems,
    recommendedItems,
    considerItems,
    sunsetCandidates,
    summary: {
      totalCoreItems: coreItems.length,
      totalRecommended: recommendedItems.length,
      totalConsider: considerItems.length,
      totalSunset: sunsetCandidates.length,
      estimatedUniversalMenuSize: coreItems.length + recommendedItems.length
    }
  };

  // ============================================================================
  // BUILD PROPOSED MENU - Opinionated, Consolidated
  // ============================================================================

  // Helper: spell out numbers <10
  const spellOutNumber = (n: number): string => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    return n < 10 ? words[n] : String(n);
  };

  // Helper: extract size info from item name
  const sizeInfo: Record<string, { order: number; label: string; isDefault?: boolean }> = {
    'sm': { order: 1, label: 'Small' },
    'small': { order: 1, label: 'Small' },
    'med': { order: 2, label: 'Medium', isDefault: true },
    'medium': { order: 2, label: 'Medium', isDefault: true },
    'lg': { order: 3, label: 'Large' },
    'lrg': { order: 3, label: 'Large' },
    'large': { order: 3, label: 'Large' },
    'half': { order: 1, label: 'Half' },
    'full': { order: 2, label: 'Full', isDefault: true },
    'single': { order: 1, label: 'Single' },
    'double': { order: 2, label: 'Double' },
    "kid's": { order: 0, label: "Kid's" },
    'kids': { order: 0, label: "Kid's" },
  };

  const extractSizeFromName = (name: string): { baseName: string; size: string | null; sizeLabel: string | null } => {
    const lowerName = name.toLowerCase();

    // Check for size prefix
    for (const [key, info] of Object.entries(sizeInfo)) {
      const prefixPattern = new RegExp(`^${key}\\s+`, 'i');
      if (prefixPattern.test(name)) {
        return {
          baseName: name.replace(prefixPattern, '').trim(),
          size: key,
          sizeLabel: info.label
        };
      }
    }

    // Check for size suffix
    for (const [key, info] of Object.entries(sizeInfo)) {
      const suffixPattern = new RegExp(`\\s+${key}$`, 'i');
      if (suffixPattern.test(name)) {
        return {
          baseName: name.replace(suffixPattern, '').trim(),
          size: key,
          sizeLabel: info.label
        };
      }
    }

    return { baseName: name, size: null, sizeLabel: null };
  };

  // Helper: extract all quantities from a name and build clean name + description
  interface QuantityInfo {
    protein: string;
    quantity: number;
    quantityText: string;
  }

  const extractQuantitiesFromName = (name: string): { cleanName: string; quantities: QuantityInfo[] } => {
    let cleanName = name;
    const quantities: QuantityInfo[] = [];

    // Protein mapping for description text (proteins capitalized)
    const proteinDescriptions: Record<string, (qty: number) => string> = {
      'catfish': (q) => `${spellOutNumber(q)} Catfish filet${q !== 1 ? 's' : ''}`,
      'whitefish': (q) => `${spellOutNumber(q)} Whitefish filet${q !== 1 ? 's' : ''}`,
      'shrimp': (q) => `${spellOutNumber(q)} Jumbo Shrimp`,
      'jumbo shrimp': (q) => `${spellOutNumber(q)} Jumbo Shrimp`,
      'tenders': (q) => `${spellOutNumber(q)} Chicken Tender${q !== 1 ? 's' : ''}`,
      'chicken tenders': (q) => `${spellOutNumber(q)} Chicken Tender${q !== 1 ? 's' : ''}`,
      'oyster': (q) => `${spellOutNumber(q)} Oyster${q !== 1 ? 's' : ''}`,
      'oysters': (q) => `${spellOutNumber(q)} Oyster${q !== 1 ? 's' : ''}`,
      'gator': (q) => `${spellOutNumber(q)} Gator Bite${q !== 1 ? 's' : ''}`,
      'nugget': (q) => `${spellOutNumber(q)} Nugget${q !== 1 ? 's' : ''}`,
      'nuggets': (q) => `${spellOutNumber(q)} Nuggets`,
      'crawfish': (q) => `${spellOutNumber(q)} Crawfish Tail${q !== 1 ? 's' : ''}`,
    };

    // Pattern 1: "Protein (N)" - e.g., "Catfish (8)", "Jumbo Shrimp (6)"
    const parenPattern = /(\b(?:Jumbo\s+)?(?:Catfish|Whitefish|Shrimp|Tenders|Chicken\s+Tenders|Oysters?|Gator|Nuggets?|Crawfish))\s*\((\d+)\)/gi;
    let match;

    while ((match = parenPattern.exec(cleanName)) !== null) {
      const protein = match[1].toLowerCase().trim();
      const qty = parseInt(match[2], 10);
      const proteinKey = Object.keys(proteinDescriptions).find(k => protein.includes(k)) || 'piece';
      const descFn = proteinDescriptions[proteinKey] || ((q: number) => `${spellOutNumber(q)} piece${q !== 1 ? 's' : ''}`);

      quantities.push({
        protein: match[1],
        quantity: qty,
        quantityText: descFn(qty)
      });
    }

    // Remove all "(N)" from the name
    cleanName = cleanName.replace(/\s*\(\d+\)/g, '');

    // Pattern 2: Leading quantity "N Protein" - e.g., "6 Jumbo Shrimp"
    if (quantities.length === 0) {
      const leadingMatch = cleanName.match(/^(\d+)\s+((?:Jumbo\s+)?(?:Catfish|Whitefish|Shrimp|Tenders|Oysters?|Gator|Nuggets?|Crawfish).*)$/i);
      if (leadingMatch) {
        const qty = parseInt(leadingMatch[1], 10);
        const rest = leadingMatch[2].toLowerCase();
        const proteinKey = Object.keys(proteinDescriptions).find(k => rest.includes(k)) || 'piece';
        const descFn = proteinDescriptions[proteinKey] || ((q: number) => `${spellOutNumber(q)} piece${q !== 1 ? 's' : ''}`);

        quantities.push({
          protein: leadingMatch[2],
          quantity: qty,
          quantityText: descFn(qty)
        });

        cleanName = leadingMatch[2].trim();
      }
    }

    // Apply formatting rules
    cleanName = cleanName.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp');
    cleanName = cleanName.replace(/\bJumbo shrimp\b/g, 'Jumbo Shrimp');
    cleanName = cleanName.replace(/\btenders\b/g, 'Tenders');
    cleanName = cleanName.replace(/\bEtouffee\b/gi, 'Étouffée');
    cleanName = cleanName.replace(/\bétouffée\b/g, 'Étouffée');
    cleanName = cleanName.replace(/\bfried oysters\b/gi, 'Fried Oysters');

    // Clean up spacing and ampersands
    cleanName = cleanName.replace(/\s+&\s+/g, ' & ');
    cleanName = cleanName.replace(/\s{2,}/g, ' ');
    cleanName = cleanName.trim();

    return { cleanName, quantities };
  };

  // Helper: build description from quantities and original description
  const buildDescription = (
    quantities: QuantityInfo[],
    originalDesc?: string
  ): string => {
    const parts: string[] = [];

    if (quantities.length > 0) {
      // Join multiple quantities with " & "
      let qtyDesc = quantities.map(q => q.quantityText).join(' & ');
      // Capitalize first letter
      qtyDesc = qtyDesc.charAt(0).toUpperCase() + qtyDesc.slice(1);
      parts.push(qtyDesc);
    }

    if (originalDesc) {
      let desc = originalDesc.trim();
      // Remove trailing period from single sentences
      if (desc.endsWith('.') && (desc.match(/\./g) || []).length === 1) {
        desc = desc.slice(0, -1);
      }
      // Don't duplicate quantity info if it's already in description
      if (!quantities.some(q => desc.toLowerCase().includes(q.quantityText.toLowerCase()))) {
        parts.push(desc);
      }
    }

    let result = parts.join('. ') || '';
    // Ensure first letter is capitalized
    if (result) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  };

  // Get items eligible for proposed menu (core + recommended + consider, exclude hidden/sunset)
  // Using 50% threshold to include items at 8+ of 16 locations
  const eligibleItems = itemAnalysis.filter(item =>
    item.classification === 'universal' ||
    item.classification === 'universal-tweaked' ||
    (item.classification === 'multi-location' && item.locationCount >= considerThreshold)
  );

  // Group by normalized base name for consolidation
  const consolidationGroups = new Map<string, ItemAnalysisData[]>();

  eligibleItems.forEach(item => {
    const { baseName } = extractSizeFromName(item.name);
    const normalizedBase = baseName.toLowerCase().trim();

    if (!consolidationGroups.has(normalizedBase)) {
      consolidationGroups.set(normalizedBase, []);
    }
    consolidationGroups.get(normalizedBase)!.push(item);
  });

  // Build proposed menu items
  const proposedMenuItems: ProposedMenuItem[] = [];
  const globalAnnotations: string[] = [];
  let consolidatedCount = 0;

  consolidationGroups.forEach((groupItems, normalizedBase) => {
    // Check if this group has size variants
    const itemsWithSizes = groupItems.map(item => ({
      item,
      ...extractSizeFromName(item.name)
    }));

    const hasSizeVariants = itemsWithSizes.filter(i => i.size !== null).length >= 2;

    if (hasSizeVariants && groupItems.length >= 2) {
      // CONSOLIDATE: Multiple size variants → single item with modifiers
      const sortedBySizeOrder = itemsWithSizes
        .filter(i => i.size !== null)
        .sort((a, b) => {
          const orderA = sizeInfo[a.size!.toLowerCase()]?.order ?? 99;
          const orderB = sizeInfo[b.size!.toLowerCase()]?.order ?? 99;
          return orderA - orderB;
        });

      // Find the "default" size (Medium if available, or smallest)
      const defaultItem = sortedBySizeOrder.find(i =>
        sizeInfo[i.size!.toLowerCase()]?.isDefault
      ) || sortedBySizeOrder[0];

      const basePrice = defaultItem.item.priceRange?.min ?? defaultItem.item.basePrice ?? null;

      // Build modifiers for other sizes
      const modifiers: ProposedModifier[] = [];
      sortedBySizeOrder.forEach(({ item, sizeLabel, size }) => {
        if (item.id === defaultItem.item.id) return; // Skip default

        const itemPrice = item.priceRange?.min ?? item.basePrice ?? null;
        if (itemPrice !== null && basePrice !== null) {
          modifiers.push({
            name: sizeLabel!,
            priceDelta: Math.round((itemPrice - basePrice) * 100) / 100
          });
        } else {
          modifiers.push({
            name: sizeLabel!,
            priceDelta: 0
          });
        }
      });

      // Clean up the name and extract quantities
      const { cleanName, quantities } = extractQuantitiesFromName(defaultItem.baseName);

      // Build annotations
      const annotations: string[] = [];
      annotations.push(`Consolidated from ${groupItems.length} size variants: ${groupItems.map(i => i.name).join(', ')}`);
      if (modifiers.length > 0) {
        const modDesc = modifiers.map(m =>
          `${m.name}: ${m.priceDelta >= 0 ? '+' : ''}$${m.priceDelta.toFixed(2)}`
        ).join(', ');
        annotations.push(`Size modifiers: ${modDesc}`);
      }

      const originalItem = items.find(i => i.id === defaultItem.item.id);

      proposedMenuItems.push({
        id: `proposed-${normalizedBase}`,
        originalIds: groupItems.map(i => i.id),
        name: cleanName,
        description: buildDescription(quantities, originalItem?.description),
        categorySlug: defaultItem.item.categorySlug,
        categoryTitle: defaultItem.item.categoryTitle,
        basePrice,
        modifiers,
        annotations,
        sourceItemCount: groupItems.length,
        image: defaultItem.item.image
      });

      consolidatedCount += groupItems.length - 1;
    } else {
      // NO CONSOLIDATION: Single item or items without clear size variants
      groupItems.forEach(item => {
        const { cleanName, quantities } = extractQuantitiesFromName(item.name);
        const annotations: string[] = [];

        // Add annotation if name was cleaned (quantities removed)
        if (cleanName !== item.name) {
          annotations.push(`Renamed from "${item.name}"`);
        }

        const originalItem = items.find(i => i.id === item.id);

        proposedMenuItems.push({
          id: `proposed-${item.id}`,
          originalIds: [item.id],
          name: cleanName,
          description: buildDescription(quantities, originalItem?.description),
          categorySlug: item.categorySlug,
          categoryTitle: item.categoryTitle,
          basePrice: item.priceRange?.min ?? item.basePrice ?? null,
          modifiers: [],
          annotations,
          sourceItemCount: 1,
          image: item.image
        });
      });
    }
  });

  // Group proposed items by category
  const proposedByCategory = new Map<string, ProposedMenuItem[]>();
  proposedMenuItems.forEach(item => {
    if (!proposedByCategory.has(item.categorySlug)) {
      proposedByCategory.set(item.categorySlug, []);
    }
    proposedByCategory.get(item.categorySlug)!.push(item);
  });

  // Build category list
  const proposedCategories: ProposedMenuCategory[] = [];
  proposedByCategory.forEach((catItems, catSlug) => {
    const category = categories.find(c => c.slug === catSlug);
    proposedCategories.push({
      slug: catSlug,
      title: category?.title ?? catSlug,
      items: catItems.sort((a, b) => a.name.localeCompare(b.name)),
      itemCount: catItems.length
    });
  });

  // Sort categories alphabetically
  proposedCategories.sort((a, b) => a.title.localeCompare(b.title));

  // Build global annotations
  if (consolidatedCount > 0) {
    globalAnnotations.push(`Consolidated ${consolidatedCount} size/quantity variants into base items with modifiers`);
  }
  globalAnnotations.push(`Based on ${eligibleItems.length} items at 80%+ locations (Core + Recommended)`);
  globalAnnotations.push(`Excluded ${sunsetCandidates.length} location-exclusive items`);
  globalAnnotations.push(`Excluded ${considerItems.length} items at <80% of locations`);

  const proposedMenu: ProposedMenu = {
    categories: proposedCategories,
    totalItems: proposedMenuItems.length,
    totalRawItems: eligibleItems.length,
    consolidationSavings: consolidatedCount,
    annotations: globalAnnotations
  };

  const analysisData: AnalysisData = {
    categories: categoryData,
    locations: locationData,
    items: itemAnalysis,
    propertyReports,
    universalMenuProposal,
    proposedMenu,
    sharedCategories,
    universalCategories,
    orphanCategories,
    recommendations,
    totalItems: items.length,
    totalCategories: categories.length,
    totalLocations: locations.length,
    itemAvailability,
    itemClassificationCounts
  };

  return <CategoryAnalysisClient data={analysisData} />;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * @param a - The first string to compare
 * @param b - The second string to compare
 * @returns The minimum number of single-character insertions, deletions, or substitutions required to transform `a` into `b`
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}