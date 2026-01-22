'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
// NOTE: @silk-hq/components requires a commercial license for commercial use.
// Current license="non-commercial" is for development/evaluation only.
// See: https://silk-hq.com/pricing for commercial licensing options.
import { Sheet } from '@silk-hq/components';
import styles from './ModifierSelectionModal.module.css';
import type { MenuItem, CartModifier } from '@/lib/types';
import { useModifierSelection } from '@/lib/hooks/useModifierSelection';
import { useMountedRef } from '@/lib/hooks/useMountedRef';

interface ModifierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (modifiers: CartModifier[], specialInstructions: string, quantity: number) => void;
  menuItem: MenuItem;
}

export default function ModifierSelectionModal({
  isOpen,
  onClose,
  onAddToCart,
  menuItem,
}: ModifierSelectionModalProps) {
  const {
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
  } = useModifierSelection({ menuItem, isOpen });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollFade, setShowScrollFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useMountedRef();

  // Reset scroll fade when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowScrollFade(true);
    }
  }, [isOpen]);

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
      const timer = setTimeout(handleScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleScroll]);

  const handleAddToCart = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onAddToCart(buildCartModifiers(), specialInstructions.trim(), quantity);
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [isValid, isSubmitting, buildCartModifiers, specialInstructions, quantity, onAddToCart, mountedRef]);

  return (
    <Sheet.Root
      license="non-commercial"
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <Sheet.Portal>
        <Sheet.View className={styles.sheetView} nativeEdgeSwipePrevention={true}>
          <Sheet.Backdrop className={styles.sheetBackdrop} />
          <Sheet.Content className={styles.sheetContent}>
            <Sheet.BleedingBackground className={styles.sheetBackground} />

            {/* Header row with drag handle and close button */}
            <div className={styles.headerRow}>
              <div className={styles.dragHandle}>
                <div className={styles.dragHandleBar} />
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sheet title */}
            <div className={styles.sheetTitle}>Customize Your Order</div>

            {/* Scrollable content */}
            <div className={styles.scrollWrapper}>
              <div
                ref={scrollRef}
                className={styles.scrollContainer}
                onScroll={handleScroll}
              >
              {/* Item header */}
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
                    const avgNameLength = group.options.length > 0
                      ? group.options.reduce((sum, o) => sum + o.name.length, 0) / group.options.length
                      : 0;
                    const useCompact = !group.multiSelect && avgNameLength <= 12 && group.options.length > 0 && group.options.length <= 5;

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
                              const isSelected = selected.includes(option._key);

                              if (useCompact) {
                                return (
                                  <button
                                    type="button"
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
                                  type="button"
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
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                {/* Add button */}
                <button
                  type="button"
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
