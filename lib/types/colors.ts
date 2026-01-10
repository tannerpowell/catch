import colorData from '@/lib/design/colors.json';

/**
 * Brand color definitions - auto-generated from colors.json
 * DO NOT EDIT - modify colors.json instead and regenerate
 */
export const BRAND_COLORS = {
  oceanBlue: colorData.brand.oceanBlue.light,
  tierraReca: colorData.brand.tierraReca.light,
  cremaFresca: colorData.brand.cremaFresca.light,
  tierraSecondary: colorData.brand.tierraSecondary.light,
  tierraMuted: colorData.brand.tierraMuted.light,
  warmBrown: colorData.brand.warmBrown.light,
  aguaClara: colorData.brand.aguaClara.light,
} as const;

export const DARK_COLORS = {
  oceanBlue: colorData.brand.oceanBlue.dark,
  tierraReca: colorData.brand.tierraReca.dark,
  cremaFresca: colorData.brand.cremaFresca.dark,
  tierraSecondary: colorData.brand.tierraSecondary.dark,
  tierraMuted: colorData.brand.tierraMuted.dark,
  warmBrown: colorData.brand.warmBrown.dark,
  aguaClara: colorData.brand.aguaClara.dark,
} as const;

export const BADGE_COLORS = Object.fromEntries(
  Object.entries(colorData.badges).map(([key, val]) => [key, val.value])
) as Record<string, string>;

export type BrandColor = keyof typeof BRAND_COLORS;
export type BadgeColor = keyof typeof BADGE_COLORS;

/**
 * Get CSS custom property name for a color
 * Usage: var(${getCSSVar('oceanBlue')})
 */
export function getCSSVar(color: BrandColor): string {
  const kebab = color.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `--color-${kebab}`;
}

/**
 * Get Tailwind utility class for a color
 * Usage: getColorClass('oceanBlue', 'bg') => 'bg-ocean-blue'
 */
export function getColorClass(
  color: BrandColor,
  prefix: 'bg' | 'text' | 'border' | 'ring'
): string {
  const kebab = color.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `${prefix}-${kebab}`;
}
