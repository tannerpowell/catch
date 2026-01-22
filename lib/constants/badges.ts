import colorData from '@/lib/design/colors.json';

/**
 * All valid badge values. This is the single source of truth.
 * TypeScript type and Zod schema both derive from this array.
 */
export const BADGE_OPTIONS = [
  "Family Favorite",
  "Salvadoran",
  "Tex-Mex",
  "Spicy",
  "Vegetarian",
  "Gluten-Free",
  "Cajun",
  "Fried",
  "Grilled",
  "Boiled",
  "Market Price"
] as const;

export type Badge = (typeof BADGE_OPTIONS)[number];

/**
 * Badge display information for menu items.
 * Maps badge types to their display label and CSS custom property.
 */
export const BADGE_INFO: Partial<Record<Badge, { label: string; cssVar: string }>> = {
  'Spicy': { label: colorData.badges.spicy.label, cssVar: '--color-badge-spicy' },
  'Vegetarian': { label: colorData.badges.vegetarian.label, cssVar: '--color-badge-vegetarian' },
  'Gluten-Free': { label: colorData.badges.glutenFree.label, cssVar: '--color-badge-gluten-free' },
  'Family Favorite': { label: colorData.badges.favorite.label, cssVar: '--color-badge-favorite' },
  'Cajun': { label: colorData.badges.cajun.label, cssVar: '--color-badge-cajun' },
  'Fried': { label: colorData.badges.fried.label, cssVar: '--color-badge-fried' },
  'Grilled': { label: colorData.badges.grilled.label, cssVar: '--color-badge-grilled' },
  'Boiled': { label: colorData.badges.boiled.label, cssVar: '--color-badge-boiled' },
  'Market Price': { label: colorData.badges.marketPrice.label, cssVar: '--color-badge-market-price' },
  'Salvadoran': { label: colorData.badges.salvadoran.label, cssVar: '--color-badge-salvadoran' },
  'Tex-Mex': { label: colorData.badges.texMex.label, cssVar: '--color-badge-tex-mex' },
};
