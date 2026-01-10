'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { MenuItem, Location } from '@/lib/types';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { BADGE_INFO } from '@/lib/constants/badges';
import styles from './MenuItemModal.module.css';

interface MenuItemModalProps {
  item: MenuItem;
  price: number | null;
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  /** Called when user wants to add an item with modifiers - parent handles the modifier modal */
  onOpenModifiers?: (item: MenuItem) => void;
}

/** Format category slug for display with proper accents */
function formatCategoryName(slug: string): string {
  // Handle special cases with proper diacritical marks
  const specialCases: Record<string, string> = {
    'a-la-carte': 'À La Carte',
    'a-la-carté': 'À La Carte',
  };

  if (specialCases[slug.toLowerCase()]) {
    return specialCases[slug.toLowerCase()];
  }

  // Default: convert slug to title case
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Premium menu item detail modal.
 * Gulf Coast Editorial design with layered card effect.
 * Accessible: focus trap, ESC closes, aria labels.
 */
export function MenuItemModal({
  item,
  price,
  isOpen,
  onClose,
  location,
  onOpenModifiers,
}: MenuItemModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle keyboard navigation (ESC to close, Tab to trap focus)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Focus trap: cycle through focusable elements within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [onClose]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Lock body scroll (preserve original value)
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Add ESC listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus close button
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const badges = item.badges;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Card */}
      <div
        ref={modalRef}
        className={`${styles.card} ${!item.image ? styles.cardCompact : ''}`}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image with frame effect */}
        {item.image && (
          <div className={styles.imageWrapper}>
            <div className={styles.imageFrame}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {/* Eyebrow category */}
          {item.categorySlug && (
            <div className={styles.eyebrow}>
              {formatCategoryName(item.categorySlug)}
            </div>
          )}

          {/* Name */}
          <h2 id="modal-title" className={styles.name}>
            {item.name}
          </h2>

          {/* Price */}
          <div className={styles.price}>
            {price !== null ? (
              <>
                <span className={styles.priceCurrency}>$</span>
                <span className={styles.priceAmount}>{price.toFixed(2)}</span>
              </>
            ) : (
              <span className={styles.priceMarket}>Market Price</span>
            )}
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Description */}
          {item.description && (
            <p className={styles.description}>
              {item.description}
            </p>
          )}

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className={styles.badges}>
              {badges.map(badge => {
                const info = BADGE_INFO[badge];
                return (
                  <span
                    key={badge}
                    className={styles.badge}
                    style={{ '--badge-color': `var(${info?.cssVar || '--color-tierra-muted'})` } as React.CSSProperties}
                  >
                    {info?.label || badge}
                  </span>
                );
              })}
            </div>
          )}

          {/* Spacer */}
          <div className={styles.spacer} />

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              Close
            </button>
            {item.modifierGroups && item.modifierGroups.length > 0 && onOpenModifiers ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => onOpenModifiers(item)}
              >
                <span>Customize</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <AddToCartButton
                menuItem={price != null ? { ...item, price } : item}
                location={location}
                className={`${styles.btn} ${styles.btnPrimary}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
