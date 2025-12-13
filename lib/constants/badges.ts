import type { Badge } from '../types';

/**
 * Badge display information for menu items.
 * Maps badge types to their display label and color.
 */
export const BADGE_INFO: Partial<Record<Badge, { label: string; color: string }>> = {
  'Spicy': { label: 'Spicy', color: '#e74c3c' },
  'Vegetarian': { label: 'Vegetarian', color: '#27ae60' },
  'Gluten-Free': { label: 'GF', color: '#8e44ad' },
  'Family Favorite': { label: 'Favorite', color: '#f39c12' },
  'Cajun': { label: 'Cajun', color: '#d35400' },
  'Fried': { label: 'Fried', color: '#c9a96a' },
  'Grilled': { label: 'Grilled', color: '#6d4c41' },
  'Boiled': { label: 'Boiled', color: '#3498db' },
  'Market Price': { label: 'Market Price', color: '#7f8c8d' },
  'Salvadoran': { label: 'Salvadoran', color: '#2980b9' },
  'Tex-Mex': { label: 'Tex-Mex', color: '#e67e22' },
};
