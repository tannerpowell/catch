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
      const required = g.required === true;
      const multiSelect = g.multiSelect === true;
      const minSelections = multiSelect && isPositiveInt(g.minSelections) ? g.minSelections : undefined;
      const maxSelections = multiSelect && isPositiveInt(g.maxSelections) ? g.maxSelections : undefined;

      return {
        _id: (g._id as string).trim(),
        name: (g.name as string).trim(),
        slug: (g.slug as string).trim(),
        description: typeof g.description === 'string' ? g.description : undefined,
        required,
        multiSelect,
        minSelections,
        maxSelections,
        displayOrder: typeof g.displayOrder === 'number' && Number.isFinite(g.displayOrder) ? g.displayOrder : undefined,
        options: (Array.isArray(g.options) ? g.options : [])
          .filter((opt): opt is Record<string, unknown> =>
            opt !== null && typeof opt === 'object' &&
            isNonEmptyString(opt._key) &&
            isNonEmptyString(opt.name))
          .map((opt) => ({
            _key: (opt._key as string).trim(),
            name: (opt.name as string).trim(),
            price: typeof opt.price === 'number' && Number.isFinite(opt.price) ? opt.price : undefined,
            isDefault: opt.isDefault === true,
            available: opt.available !== false,
            calories: typeof opt.calories === 'number' && Number.isFinite(opt.calories) ? opt.calories : undefined,
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
    .filter((o) =>
      isNonEmptyString(o._key) &&
      isNonEmptyString(o.modifierGroupId) &&
      isNonEmptyString(o.optionName)
    )
    .map((o) => ({
      _key: (o._key as string).trim(),
      modifierGroupId: (o.modifierGroupId as string).trim(),
      optionName: (o.optionName as string).trim(),
      price: typeof o.price === 'number' && Number.isFinite(o.price) ? o.price : undefined,
      available: o.available !== false,
    }));

  return normalized.length > 0 ? normalized : undefined;
}
