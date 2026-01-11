import type { ModifierGroup, ItemModifierOverride, LocationOverride } from "@/lib/types";

export function normalizeOverrides(
  arr: { loc: string; price?: number | null; available?: boolean }[] | undefined
): Record<string, LocationOverride> {
  if (!arr) return {};
  return Object.fromEntries(
    arr
      .filter((o) => typeof o.loc === 'string' && o.loc.trim().length > 0)
      .map((o) => [
        o.loc,
        {
          price: typeof o.price === 'number' ? o.price : undefined,
          available: o.available !== false, // Default to true unless explicitly false
        },
      ])
  );
}

function isPositiveInt(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

export function normalizeModifierGroups(groups: unknown): ModifierGroup[] | undefined {
  if (!Array.isArray(groups) || groups.length === 0) return undefined;

  const normalized = groups
    .filter((g): g is Record<string, unknown> => g !== null && typeof g === 'object')
    .filter((g) =>
      isNonEmptyString(g._id) &&
      isNonEmptyString(g.slug) &&
      isNonEmptyString(g.name)
    )
    .map((g) => {
      const minSelections = isPositiveInt(g.minSelections) ? g.minSelections : undefined;
      const maxSelections = isPositiveInt(g.maxSelections) ? g.maxSelections : undefined;

      return {
        _id: String(g._id),
        name: String(g.name),
        slug: String(g.slug),
        description: typeof g.description === 'string' ? g.description : undefined,
        required: Boolean(g.required),
        multiSelect: Boolean(g.multiSelect),
        minSelections,
        maxSelections,
        displayOrder: typeof g.displayOrder === 'number' ? g.displayOrder : undefined,
        options: (Array.isArray(g.options) ? g.options : [])
          .filter((opt): opt is Record<string, unknown> =>
            opt !== null && typeof opt === 'object' &&
            isNonEmptyString(opt._key) &&
            isNonEmptyString(opt.name))
          .map((opt) => ({
            _key: String(opt._key),
            name: String(opt.name),
            price: typeof opt.price === 'number' ? opt.price : undefined,
            isDefault: Boolean(opt.isDefault),
            available: opt.available !== false,
            calories: typeof opt.calories === 'number' ? opt.calories : undefined,
          })),
      };
    })
    // Validate min/max relationship and required groups have options
    .filter((g) => {
      if (g.minSelections !== undefined && g.maxSelections !== undefined) {
        if (g.minSelections > g.maxSelections) return false;
      }
      if (g.required && g.options.length === 0) return false;
      return true;
    });

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
