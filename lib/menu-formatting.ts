/**
 * Menu Formatting Rules - Shared Utilities
 *
 * Consolidated formatting functions used by:
 * - sanity-config/plugins/menu-manager/pane.tsx (Menu Manager UI)
 * - scripts/menu-formatting-rules.ts (batch formatting script)
 *
 * These rules ensure consistent formatting of menu item names and descriptions
 * across the entire application.
 */

// ============================================================================
// HELPERS
// ============================================================================

/** Escape regex special characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Title-case a string (capitalize first letter of each word) */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// SHARED RULES (apply to both names and descriptions)
// ============================================================================

function applySharedRules(text: string): string {
  let fixed = text;

  // Remove leading/trailing whitespace and commas
  fixed = fixed.trim();
  fixed = fixed.replace(/^,\s*/, '');

  // Remove markdown formatting like **fried**
  fixed = fixed.replace(/\*\*(fried|Fried|grilled|Grilled|blackened|Blackened)\*\*/gi, (_, word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  // Fix measurements: "1 Pound" → "1lb"
  fixed = fixed.replace(/(\d+(?:\/\d+)?)\s*(?:LB|Pound|Pounds?)\b/gi, (_, num) => `${num}lb`);
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2');

  // "Jumbo Shrimp" always capitalized
  fixed = fixed.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp');

  // Monterey Jack spelling
  fixed = fixed.replace(/\bMonterrey Jack\b/gi, 'Monterey Jack');

  // Étouffée handling (normalize both accented and unaccented spellings)
  fixed = fixed.replace(/\bShrimp (?:étouffée|Etouffee)\b/gi, 'Shrimp Étouffée');

  return fixed;
}

// ============================================================================
// NAME-SPECIFIC RULES (conservative - preserve capitalization for titles)
// ============================================================================

export function formatMenuItemName(name: string): string {
  if (!name) return name;

  let fixed = applySharedRules(name);

  // Fix protein quantity format: "8 Catfish" → "Catfish (8)"
  // But NOT "5, 8 or 12 Jumbo Shrimp" choice lists
  fixed = fixed.replace(
    /^(\d+)\s+(Catfish|Whitefish|Chicken [Tt]enders?|Tenders?)$/gi,
    (_, num, protein) => {
      const normalized = protein.toLowerCase();
      if (normalized === 'tenders') {
        return `Chicken Tenders (${num})`;
      }
      return `${titleCase(protein)} (${num})`;
    }
  );

  // Fix incomplete protein lists in names: "Catfish (8) & 12 jumbo shrimp"
  fixed = fixed.replace(
    /([A-Z][a-z]+)\s*\((\d+)\)\s*(&|,)\s*(\d+)\s+(jumbo shrimp)/gi,
    (_, protein1, num1, separator, num2) => `${protein1} (${num1}) ${separator} Jumbo Shrimp (${num2})`
  );

  // Fix lowercase "tenders" in names → "Tenders"
  fixed = fixed.replace(/\btenders\b/g, 'Tenders');

  // Fix "fried oysters" → "Fried Oysters" in names (it's a menu item)
  fixed = fixed.replace(/\bfried oysters\b/gi, 'Fried Oysters');

  return fixed;
}

// ============================================================================
// DESCRIPTION-SPECIFIC RULES (more aggressive formatting)
// ============================================================================

export function formatMenuItemDescription(desc: string): string {
  if (!desc) return desc;

  let fixed = applySharedRules(desc);

  // Remove trailing period from single-sentence descriptions
  const periodCount = (fixed.match(/\./g) || []).length;
  if (periodCount === 1 && fixed.endsWith('.')) {
    fixed = fixed.slice(0, -1);
  }

  // Move quantities for proteins: "8 Catfish" → "Catfish (8)"
  fixed = fixed.replace(
    /(?<![,\d]\s)(?<!\bor\s)(\d+)\s+(Catfish|Whitefish|Oysters?|Crawfish Tails?|Gator)\b(?!\s*\()/gi,
    (_, num, protein) => {
      const capitalizedProtein = protein.charAt(0).toUpperCase() + protein.slice(1).toLowerCase();
      return `${capitalizedProtein} (${num})`;
    }
  );

  // Handle "& 8 tenders" → "& Chicken Tenders (8)"
  fixed = fixed.replace(/&\s*(\d+)\s+(tenders?)(?!\s*\()/gi, (_, num) => `& Chicken Tenders (${num})`);

  // Fix incomplete lists: "Catfish (8) & 12 jumbo shrimp" → "Catfish (8) & Jumbo Shrimp (12)"
  fixed = fixed.replace(
    /([A-Z][a-z]+)\s*\((\d+)\)\s*(&|,)\s*(\d+)\s+(jumbo shrimp)/gi,
    (_, protein1, num1, separator, num2) => `${protein1} (${num1}) ${separator} Jumbo Shrimp (${num2})`
  );

  // Ensure main proteins are capitalized
  fixed = fixed.replace(/\b(catfish|whitefish|shrimp|oysters?|crawfish|gator|chicken)\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });

  // Cooking methods in parentheses should be lowercase
  fixed = fixed.replace(
    /\((Fried|Grilled|Blackened|Boiled)(,?\s+(Fried|Grilled|Blackened|Boiled|or))*\)/gi,
    (match) => match.toLowerCase()
  );

  // "(1) Corn & (2) Potatoes" → "with corn-on-the-cob (1) and potatoes (2)"
  fixed = fixed.replace(
    /,?\s*\((\d+)\)\s*Corn\s*&\s*\((\d+)\)\s*Potatoes\.?/gi,
    (_, cornNum, potatoNum) => ` with corn-on-the-cob (${cornNum}) and potatoes (${potatoNum})`
  );

  // Monterey Jack cheese (lowercase cheese)
  fixed = fixed.replace(/\bMonterey Jack Cheese\b/gi, 'Monterey Jack cheese');

  // Generic food terms in descriptions should be lowercase
  const lowercaseInDesc = [
    ['Side Item', 'side item'],
    ['Diced Tomato', 'diced tomato'],
    ['Green Onion', 'green onion'],
    ['Bacon Bits', 'bacon bits'],
    ['Sour Cream', 'sour cream'],
    ['Garlic Bread', 'garlic bread'],
    ['Green Bell Peppers', 'green bell peppers'],
    ['Bed of', 'bed of'],
    ['Queso', 'queso'],
  ] as const;

  lowercaseInDesc.forEach(([term, replacement]) => {
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'g');
    fixed = fixed.replace(regex, replacement);
  });

  // Lowercase "filet"
  fixed = fixed.replace(/\bFilets?\b/g, (match) => match.toLowerCase());

  return fixed;
}

// ============================================================================
// COMBINED FUNCTION (for convenience - applies appropriate rules based on field)
// ============================================================================

export function applyFormattingRules(text: string, field: 'name' | 'description' = 'description'): string {
  if (field === 'name') {
    return formatMenuItemName(text);
  }
  return formatMenuItemDescription(text);
}
