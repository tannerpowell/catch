import { useState, useCallback, useMemo, useEffect } from 'react';
import type { MenuItem, ModifierGroup, ModifierOption, CartModifier } from '@/lib/types';

interface SelectedModifiers {
  [groupId: string]: string[]; // stores ModifierOption._key values
}

interface UseModifierSelectionOptions {
  menuItem: MenuItem;
  isOpen: boolean;
}

export function useModifierSelection({ menuItem, isOpen }: UseModifierSelectionOptions) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const modifierGroups = useMemo(() => menuItem.modifierGroups || [], [menuItem.modifierGroups]);
  const hasModifiers = modifierGroups.length > 0;

  // Clamp quantity setter with NaN/Infinity guard
  const setQuantityClamped = useCallback((q: number | ((prev: number) => number)) => {
    setQuantity((prev) => {
      const next = typeof q === 'function' ? q(prev) : q;
      // Guard against NaN/Infinity - keep previous value if invalid
      if (!Number.isFinite(next)) return prev;
      return Math.max(1, Math.trunc(next));
    });
  }, []);

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaults: SelectedModifiers = {};
      modifierGroups.forEach((group) => {
        if (group.multiSelect) {
          // Multi-select: collect ALL isDefault options
          const defaultKeys = group.options
            .filter((opt) => opt.isDefault)
            .map((opt) => opt._key);

          // Use same minRequired logic as handleOptionSelect for consistency
          const minRequired = group.required ? (group.minSelections ?? 1) : 0;
          if (defaultKeys.length < minRequired) {
            const needed = minRequired - defaultKeys.length;
            const additional = group.options
              .filter((opt) => !opt.isDefault)
              .slice(0, needed)
              .map((opt) => opt._key);
            defaults[group._id] = [...defaultKeys, ...additional];
          } else {
            defaults[group._id] = defaultKeys;
          }
        } else {
          // Single-select: pick first default or first option if required
          const defaultOption = group.options.find((opt) => opt.isDefault);
          if (defaultOption) {
            defaults[group._id] = [defaultOption._key];
          } else if (group.required && group.options.length > 0) {
            defaults[group._id] = [group.options[0]._key];
          } else {
            defaults[group._id] = [];
          }
        }
      });
      setSelectedModifiers(defaults);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [isOpen, modifierGroups]);

  const handleOptionSelect = useCallback((group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers((prev) => {
      const current = prev[group._id] || [];

      if (group.multiSelect) {
        if (current.includes(option._key)) {
          // Block removal if it would drop below minSelections for required groups
          const minRequired = group.required ? (group.minSelections ?? 1) : 0;
          if (current.length - 1 < minRequired) {
            return prev; // Can't deselect below minimum
          }
          return { ...prev, [group._id]: current.filter((k) => k !== option._key) };
        } else {
          if (group.maxSelections && current.length >= group.maxSelections) {
            return prev;
          }
          return { ...prev, [group._id]: [...current, option._key] };
        }
      } else {
        // Single-select: toggle off if already selected (only for non-required groups)
        if (current.includes(option._key) && !group.required) {
          return { ...prev, [group._id]: [] };
        }
        return { ...prev, [group._id]: [option._key] };
      }
    });
  }, []);

  const totalPrice = useMemo(() => {
    const modifierTotal = modifierGroups.reduce((acc, group) => {
      const selected = selectedModifiers[group._id] || [];
      return acc + selected.reduce((sum, optKey) => {
        const opt = group.options.find((o) => o._key === optKey);
        return sum + (typeof opt?.price === 'number' ? opt.price : 0);
      }, 0);
    }, 0);

    return ((menuItem.price || 0) + modifierTotal) * quantity;
  }, [menuItem.price, modifierGroups, selectedModifiers, quantity]);

  /** Check if a required group has met its selection requirements */
  const isGroupComplete = useCallback((group: ModifierGroup): boolean => {
    if (!group.required) return true;
    const selected = selectedModifiers[group._id] || [];
    // Use consistent minRequired logic (defaults to 1 for required groups)
    const minRequired = group.minSelections ?? 1;
    return selected.length >= minRequired;
  }, [selectedModifiers]);

  const incompleteGroups = useMemo(() => {
    return modifierGroups
      .filter((group) => !isGroupComplete(group))
      .map((g) => g.name);
  }, [modifierGroups, isGroupComplete]);

  const isValid = incompleteGroups.length === 0;

  const buildCartModifiers = useCallback((): CartModifier[] => {
    const cartModifiers: CartModifier[] = [];
    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group._id] || [];
      selected.forEach((optKey) => {
        const opt = group.options.find((o) => o._key === optKey);
        if (opt) {
          cartModifiers.push({
            name: group.name,
            option: opt.name,
            priceDelta: typeof opt.price === 'number' ? opt.price : 0,
          });
        }
      });
    });
    return cartModifiers;
  }, [modifierGroups, selectedModifiers]);

  return {
    selectedModifiers,
    specialInstructions,
    setSpecialInstructions,
    quantity,
    setQuantity: setQuantityClamped,
    modifierGroups,
    hasModifiers,
    handleOptionSelect,
    totalPrice,
    isValid,
    incompleteGroups,
    buildCartModifiers,
  };
}
