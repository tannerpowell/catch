import { useState, useCallback, useMemo, useEffect } from 'react';
import type { MenuItem, ModifierGroup, ModifierOption, CartModifier } from '@/lib/types';

interface SelectedModifiers {
  [groupId: string]: string[];
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

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaults: SelectedModifiers = {};
      modifierGroups.forEach((group) => {
        const defaultOption = group.options.find((opt) => opt.isDefault);
        if (defaultOption) {
          defaults[group._id] = [defaultOption.name];
        } else if (group.required && !group.multiSelect && group.options.length > 0) {
          defaults[group._id] = [group.options[0].name];
        } else {
          defaults[group._id] = [];
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
        if (current.includes(option.name)) {
          return { ...prev, [group._id]: current.filter((n) => n !== option.name) };
        } else {
          if (group.maxSelections && current.length >= group.maxSelections) {
            return prev;
          }
          return { ...prev, [group._id]: [...current, option.name] };
        }
      } else {
        // Single-select: toggle off if already selected (only for non-required groups)
        if (current.includes(option.name) && !group.required) {
          return { ...prev, [group._id]: [] };
        }
        return { ...prev, [group._id]: [option.name] };
      }
    });
  }, []);

  const totalPrice = useMemo(() => {
    let base = menuItem.price || 0;

    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group._id] || [];
      selected.forEach((optName) => {
        const opt = group.options.find((o) => o.name === optName);
        if (typeof opt?.price === 'number') {
          base += opt.price;
        }
      });
    });

    return base * quantity;
  }, [menuItem.price, modifierGroups, selectedModifiers, quantity]);

  const isValid = useMemo(() => {
    return modifierGroups.every((group) => {
      if (!group.required) return true;
      const selected = selectedModifiers[group._id] || [];
      if (group.multiSelect && group.minSelections) {
        return selected.length >= group.minSelections;
      }
      return selected.length > 0;
    });
  }, [modifierGroups, selectedModifiers]);

  const incompleteGroups = useMemo(() => {
    return modifierGroups
      .filter((group) => {
        if (!group.required) return false;
        const selected = selectedModifiers[group._id] || [];
        if (group.multiSelect && group.minSelections) {
          return selected.length < group.minSelections;
        }
        return selected.length === 0;
      })
      .map((g) => g.name);
  }, [modifierGroups, selectedModifiers]);

  const buildCartModifiers = useCallback((): CartModifier[] => {
    const cartModifiers: CartModifier[] = [];
    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group._id] || [];
      selected.forEach((optName) => {
        const opt = group.options.find((o) => o.name === optName);
        cartModifiers.push({
          name: group.name,
          option: optName,
          priceDelta: typeof opt?.price === 'number' ? opt.price : 0,
        });
      });
    });
    return cartModifiers;
  }, [modifierGroups, selectedModifiers]);

  return {
    selectedModifiers,
    specialInstructions,
    setSpecialInstructions,
    quantity,
    setQuantity,
    modifierGroups,
    hasModifiers,
    handleOptionSelect,
    totalPrice,
    isValid,
    incompleteGroups,
    buildCartModifiers,
  };
}
