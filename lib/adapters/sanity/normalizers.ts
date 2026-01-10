import type { ModifierGroup, ItemModifierOverride, LocationOverride } from "@/lib/types";

export function normalizeOverrides(
  arr: { loc: string; price?: number | null; available?: boolean }[] | undefined
): Record<string, LocationOverride> {
  if (!arr) return {};
  return Object.fromEntries(
    arr.map((o) => [
      o.loc,
      {
        price: typeof o.price === 'number' ? o.price : undefined,
        available: o.available,
      },
    ])
  );
}

export function normalizeModifierGroups(groups: unknown): ModifierGroup[] | undefined {
  if (!Array.isArray(groups) || groups.length === 0) return undefined;

  const normalized = groups
    .filter((g): g is Record<string, unknown> => g !== null && typeof g === 'object')
    .filter((g) => g._id && g.slug && g.name)
    .map((g) => ({
      _id: String(g._id),
      name: String(g.name),
      slug: String(g.slug),
      description: typeof g.description === 'string' ? g.description : undefined,
      required: Boolean(g.required),
      multiSelect: Boolean(g.multiSelect),
      minSelections: typeof g.minSelections === 'number' ? g.minSelections : undefined,
      maxSelections: typeof g.maxSelections === 'number' ? g.maxSelections : undefined,
      displayOrder: typeof g.displayOrder === 'number' ? g.displayOrder : undefined,
      options: (Array.isArray(g.options) ? g.options : [])
        .filter((opt): opt is Record<string, unknown> =>
          opt !== null && typeof opt === 'object' && opt._key && opt.name)
        .map((opt) => ({
          _key: String(opt._key),
          name: String(opt.name),
          price: typeof opt.price === 'number' ? opt.price : undefined,
          isDefault: Boolean(opt.isDefault),
          available: opt.available !== false,
          calories: typeof opt.calories === 'number' ? opt.calories : undefined,
        })),
    }));

  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeItemModifierOverrides(overrides: unknown): ItemModifierOverride[] | undefined {
  if (!Array.isArray(overrides) || overrides.length === 0) return undefined;

  const normalized = overrides
    .filter((o): o is Record<string, unknown> => o !== null && typeof o === 'object')
    .filter((o) => o._key && o.modifierGroupId && o.optionName)
    .map((o) => ({
      _key: String(o._key),
      modifierGroupId: String(o.modifierGroupId),
      optionName: String(o.optionName),
      price: typeof o.price === 'number' ? o.price : undefined,
      available: o.available !== false,
    }));

  return normalized.length > 0 ? normalized : undefined;
}
