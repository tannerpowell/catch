'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Sheet } from '@silk-hq/components';
import styles from './ModifierSelectionModal.module.css';
import type { MenuItem, ModifierGroup, ModifierOption, CartModifier } from '@/lib/types';

interface ModifierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (modifiers: CartModifier[], specialInstructions: string, quantity: number) => void;
  menuItem: MenuItem;
}

interface SelectedModifiers {
  [groupId: string]: string[];
}

export default function ModifierSelectionModal({
  isOpen,
  onClose,
  onAddToCart,
  menuItem,
}: ModifierSelectionModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollFade, setShowScrollFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modifierGroups = useMemo(() => menuItem.modifierGroups || [], [menuItem.modifierGroups]);
  const hasModifiers = modifierGroups.length > 0;

  // Initialize default selections
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
      setShowScrollFade(true);
    }
  }, [isOpen, modifierGroups]);

  // Check if scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setShowScrollFade(!isAtBottom);
  }, []);

  // Check scroll on mount and when content changes
  useEffect(() => {
    if (isOpen) {
      // Small delay to let content render
      const timer = setTimeout(handleScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleScroll]);

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
        return { ...prev, [group._id]: [option.name] };
      }
    });
  }, []);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let base = menuItem.price || 0;

    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group._id] || [];
      selected.forEach((optName) => {
        const opt = group.options.find((o) => o.name === optName);
        if (opt?.price) {
          base += opt.price;
        }
      });
    });

    return base * quantity;
  }, [menuItem.price, modifierGroups, selectedModifiers, quantity]);

  // Check if all required groups have selections
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

  // Get validation message for incomplete required groups
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

  const handleAddToCart = useCallback(() => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    const cartModifiers: CartModifier[] = [];
    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group._id] || [];
      selected.forEach((optName) => {
        const opt = group.options.find((o) => o.name === optName);
        cartModifiers.push({
          name: group.name,
          option: optName,
          priceDelta: opt?.price || 0,
        });
      });
    });

    setTimeout(() => {
      onAddToCart(cartModifiers, specialInstructions.trim(), quantity);
      setIsSubmitting(false);
    }, 200);
  }, [isValid, isSubmitting, modifierGroups, selectedModifiers, specialInstructions, quantity, onAddToCart]);

  return (
    <Sheet.Root
      license="non-commercial"
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <Sheet.Portal>
        <Sheet.View className={styles.sheetView} nativeEdgeSwipePrevention={true}>
          <Sheet.Backdrop className={styles.sheetBackdrop} themeColorDimming="auto" />
          <Sheet.Content className={styles.sheetContent}>
            <Sheet.BleedingBackground className={styles.sheetBackground} />

            {/* Drag handle */}
            <div className={styles.dragHandle}>
              <div className={styles.dragHandleBar} />
            </div>

            {/* Scrollable content */}
            <div className={styles.scrollWrapper}>
              <div
                ref={scrollRef}
                className={styles.scrollContainer}
                onScroll={handleScroll}
              >
              {/* Header */}
              <div className={styles.header}>
                {menuItem.image && (
                  <div className={styles.headerImage}>
                    <Image
                      src={menuItem.image}
                      alt={menuItem.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className={styles.headerText}>
                  <h2 className={styles.itemName}>{menuItem.name}</h2>
                  {menuItem.description && (
                    <p className={styles.itemDescription}>{menuItem.description}</p>
                  )}
                  <div className={styles.itemPrice}>${(menuItem.price || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Modifier groups */}
              {hasModifiers && (
                <div className={styles.modifierGroups}>
                  {modifierGroups.map((group) => {
                    const selected = selectedModifiers[group._id] || [];
                    const isComplete = group.required ? selected.length > 0 : true;

                    // Use compact chips for groups with short option names (<=12 chars avg)
                    const avgNameLength = group.options.reduce((sum, o) => sum + o.name.length, 0) / group.options.length;
                    const useCompact = !group.multiSelect && avgNameLength <= 12 && group.options.length <= 5;

                    return (
                      <div key={group._id} className={styles.modifierGroup}>
                        <div className={styles.groupHeader}>
                          <div className={styles.groupTitleRow}>
                            <h3 className={styles.groupTitle}>{group.name}</h3>
                            {group.required && (
                              <span className={`${styles.requiredBadge} ${isComplete ? styles.complete : ''}`}>
                                {isComplete ? '✓' : 'Required'}
                              </span>
                            )}
                          </div>
                          {group.multiSelect && (
                            <p className={styles.groupHint}>
                              {group.minSelections ? `Choose at least ${group.minSelections}` : 'Choose any'}
                              {group.maxSelections ? ` (max ${group.maxSelections})` : ''}
                            </p>
                          )}
                        </div>

                        <div className={useCompact ? styles.optionsListCompact : styles.optionsList}>
                          {group.options
                            .filter((opt) => opt.available !== false)
                            .map((option) => {
                              const isSelected = selected.includes(option.name);

                              if (useCompact) {
                                return (
                                  <button
                                    key={option._key}
                                    className={`${styles.optionItemCompact} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => handleOptionSelect(group, option)}
                                  >
                                    <span className={styles.optionName}>{option.name}</span>
                                    {option.price !== undefined && option.price > 0 && (
                                      <span className={styles.optionPrice}>+${option.price.toFixed(2)}</span>
                                    )}
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={option._key}
                                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                                  onClick={() => handleOptionSelect(group, option)}
                                >
                                  <div className={styles.optionInfo}>
                                    <span className={styles.optionName}>{option.name}</span>
                                    {option.price !== undefined && option.price > 0 && (
                                      <span className={styles.optionPrice}>+${option.price.toFixed(2)}</span>
                                    )}
                                  </div>
                                  <div className={`${styles.optionCheck} ${group.multiSelect ? styles.checkbox : styles.radio}`}>
                                    {isSelected && (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Special instructions */}
              {menuItem.allowSpecialInstructions !== false && (
                <div className={styles.instructionsSection}>
                  <label className={styles.instructionsLabel}>Special Instructions</label>
                  <textarea
                    className={styles.instructionsInput}
                    placeholder="Allergies, preferences, etc."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    maxLength={200}
                  />
                </div>
              )}
              </div>
              {/* Scroll fade indicator */}
              <div className={`${styles.scrollFade} ${!showScrollFade ? styles.hidden : ''}`} />
            </div>

            {/* Fixed footer */}
            <div className={styles.footer}>
              {/* Validation message */}
              {!isValid && incompleteGroups.length > 0 && (
                <div className={styles.validationMessage}>
                  Please select: {incompleteGroups.join(', ')}
                </div>
              )}

              <div className={styles.footerRow}>
                {/* Quantity */}
                <div className={styles.quantityControl}>
                  <button
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                {/* Add button */}
                <button
                  className={`${styles.addButton} ${!isValid ? styles.disabled : ''}`}
                  onClick={handleAddToCart}
                  disabled={!isValid || isSubmitting}
                >
                  <span>{isSubmitting ? 'Adding...' : 'Add to Order'}</span>
                  <span className={styles.addButtonPrice}>${totalPrice.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
