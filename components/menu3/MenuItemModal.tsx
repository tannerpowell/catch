'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { MenuItem, Location } from '@/lib/types';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { BADGE_INFO } from '@/lib/constants/badges';

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
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Layered Card Structure */}
      <div className={`modal-outer-frame ${!item.image ? 'modal-outer-frame--compact' : ''}`}>
        <div
          ref={modalRef}
          className={`modal-inner-card ${!item.image ? 'modal-inner-card--no-image' : ''}`}
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Image with frame effect */}
          {item.image && (
            <div className="modal-image-wrapper">
              <div className="modal-image-frame">
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
          <div className="modal-content">
            {/* Eyebrow category */}
            {item.categorySlug && (
              <div className="modal-eyebrow">
                {formatCategoryName(item.categorySlug)}
              </div>
            )}

            {/* Name */}
            <h2 id="modal-title" className="modal-name">
              {item.name}
            </h2>

            {/* Price */}
            <div className="modal-price">
              {price !== null ? (
                <>
                  <span className="modal-price-currency">$</span>
                  <span className="modal-price-amount">{price.toFixed(2)}</span>
                </>
              ) : (
                <span className="modal-price-market">Market Price</span>
              )}
            </div>

            {/* Divider */}
            <div className="modal-divider" />

            {/* Description */}
            {item.description && (
              <p className="modal-description">
                {item.description}
              </p>
            )}

            {/* Badges */}
            {badges && badges.length > 0 && (
              <div className="modal-badges">
                {badges.map(badge => {
                  const info = BADGE_INFO[badge];
                  return (
                    <span
                      key={badge}
                      className="modal-badge"
                      style={{ '--badge-color': info?.color || '#7c6a63' } as React.CSSProperties}
                    >
                      {info?.label || badge}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Spacer */}
            <div className="modal-spacer" />

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              {item.modifierGroups && item.modifierGroups.length > 0 && onOpenModifiers ? (
                <button
                  type="button"
                  className="modal-btn modal-btn-primary"
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
                  className="modal-btn modal-btn-primary"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ============================================
           GULF COAST EDITORIAL MODAL
           Layered card design with warm ocean palette
           ============================================ */

        .modal-backdrop {
          --modal-cream: #FDF8ED;
          --modal-cream-dark: #f5efe5;
          --modal-tierra: #322723;
          --modal-tierra-secondary: #5b4a42;
          --modal-tierra-muted: #7c6a63;
          --modal-ocean: #2B7A9B;
          --modal-ocean-light: #3d8fb0;
          --modal-ocean-glow: rgba(43, 122, 155, 0.15);

          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 2000;
          animation: backdropReveal 0.4s cubic-bezier(0.4, 0, 0.2, 1);

          /* Warm tinted backdrop with subtle texture */
          background:
            radial-gradient(ellipse at 30% 20%, rgba(43, 122, 155, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(50, 39, 35, 0.06) 0%, transparent 50%),
            rgba(50, 39, 35, 0.75);
          backdrop-filter: blur(8px);
        }

        @keyframes backdropReveal {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        /* Outer frame - creates layered depth like voucherfied */
        .modal-outer-frame {
          position: relative;
          max-width: 920px;
          width: 100%;
          background: var(--modal-cream-dark);
          border: 1px solid rgba(50, 39, 35, 0.12);
          border-radius: 16px;
          padding: 6px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            0 25px 60px rgba(50, 39, 35, 0.35),
            0 10px 30px rgba(50, 39, 35, 0.2);
          animation: modalEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Inner card - the main content area */
        .modal-inner-card {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--modal-cream);
          border: 1px solid rgba(50, 39, 35, 0.08);
          border-radius: 10px;
          overflow: hidden;
          box-shadow:
            0 4px 20px rgba(50, 39, 35, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        /* Compact variant for items without images */
        .modal-outer-frame--compact {
          max-width: 520px;
        }

        .modal-inner-card--no-image {
          grid-template-columns: 1fr;
        }

        /* Close button - refined circular style */
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          padding: 0;
          background: var(--modal-cream);
          border: 1px solid rgba(50, 39, 35, 0.1);
          border-radius: 50%;
          color: var(--modal-tierra-muted);
          cursor: pointer;
          z-index: 10;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 2px 8px rgba(50, 39, 35, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .modal-close:hover {
          background: white;
          color: var(--modal-tierra);
          transform: scale(1.08);
          box-shadow:
            0 4px 16px rgba(50, 39, 35, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }

        .modal-close:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px var(--modal-ocean-glow),
            0 0 0 4px var(--modal-ocean),
            0 4px 16px rgba(50, 39, 35, 0.15);
        }

        /* Image section with frame effect */
        .modal-image-wrapper {
          position: relative;
          min-height: 380px;
          padding: 16px;
          background: linear-gradient(
            135deg,
            rgba(50, 39, 35, 0.03) 0%,
            rgba(50, 39, 35, 0.06) 100%
          );
        }

        .modal-image-frame {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 348px;
          background: white;
          border: 4px solid white;
          border-radius: 2px; /* Formula: innerCard(10px) - padding(16px) ≈ 0, use 2px for softness */
          overflow: hidden;
          box-shadow:
            0 4px 20px rgba(50, 39, 35, 0.15),
            0 1px 3px rgba(50, 39, 35, 0.1);
        }

        /* Content section */
        .modal-content {
          display: flex;
          flex-direction: column;
          padding: 40px 36px 32px;
          overflow-y: auto;
          max-height: 85vh;
        }

        /* Eyebrow category label */
        .modal-eyebrow {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--modal-ocean);
          margin-bottom: 12px;
        }

        /* Item name - editorial serif style */
        .modal-name {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 32px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: var(--modal-tierra);
          margin: 0 0 16px;
        }

        /* Price styling */
        .modal-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 24px;
        }

        .modal-price-currency {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 18px;
          font-weight: 500;
          color: var(--modal-tierra-muted);
        }

        .modal-price-amount {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 28px;
          font-weight: 600;
          color: var(--modal-tierra);
          letter-spacing: -0.01em;
        }

        .modal-price-market {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 16px;
          font-weight: 500;
          font-style: italic;
          color: var(--modal-tierra-muted);
        }

        /* Decorative divider */
        .modal-divider {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, var(--modal-ocean), var(--modal-ocean-light));
          border-radius: 2px;
          margin-bottom: 24px;
          opacity: 0.8;
        }

        /* Description text */
        .modal-description {
          font-family: var(--font-body, 'Source Sans 3', system-ui, sans-serif);
          font-size: 15px;
          line-height: 1.7;
          color: var(--modal-tierra-secondary);
          margin: 0 0 20px;
        }

        /* Badge pills */
        .modal-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .modal-badge {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 6px;
          color: var(--badge-color);
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--badge-color) 8%, transparent) 0%,
            color-mix(in srgb, var(--badge-color) 12%, transparent) 100%
          );
          border: 1px solid color-mix(in srgb, var(--badge-color) 20%, transparent);
        }

        /* Spacer to push actions to bottom */
        .modal-spacer {
          flex: 1;
          min-height: 16px;
        }

        /* Action buttons */
        .modal-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(50, 39, 35, 0.08);
        }

        .modal-btn {
          font-family: var(--font-family--headings, 'Poppins', system-ui, sans-serif);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 14px 24px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-btn-secondary {
          background: transparent;
          color: var(--modal-tierra-muted);
          border: 1px solid rgba(50, 39, 35, 0.15);
        }

        .modal-btn-secondary:hover {
          background: rgba(50, 39, 35, 0.04);
          border-color: rgba(50, 39, 35, 0.25);
          color: var(--modal-tierra);
        }

        .modal-btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(
            135deg,
            var(--modal-ocean) 0%,
            var(--modal-ocean-light) 100%
          );
          color: white;
          box-shadow:
            0 4px 14px rgba(43, 122, 155, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .modal-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow:
            0 6px 20px rgba(43, 122, 155, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .modal-btn-primary:active {
          transform: translateY(0);
        }

        .modal-btn:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px var(--modal-ocean-glow),
            0 0 0 4px var(--modal-ocean);
        }

        /* Mobile: single column layout */
        @media (max-width: 768px) {
          .modal-backdrop {
            padding: 16px;
            align-items: flex-end;
          }

          .modal-outer-frame {
            max-height: 92vh;
            padding: 6px 6px 0 6px;
            border-radius: 16px 16px 0 0;
            animation: modalEnterMobile 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes modalEnterMobile {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-inner-card {
            grid-template-columns: 1fr;
            border-radius: 10px 10px 0 0;
            max-height: calc(92vh - 12px);
            overflow-y: auto;
          }

          .modal-image-wrapper {
            min-height: 220px;
            max-height: 35vh;
            padding: 12px;
          }

          .modal-image-frame {
            min-height: unset;
            height: 100%;
          }

          .modal-content {
            padding: 28px 24px 32px;
            max-height: unset;
            overflow: visible;
          }

          .modal-name {
            font-size: 26px;
          }

          .modal-close {
            top: 12px;
            right: 12px;
            width: 38px;
            height: 38px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-btn-secondary {
            order: 2;
          }

          .modal-btn-primary {
            order: 1;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .modal-backdrop,
          .modal-outer-frame {
            animation: none;
          }

          .modal-btn,
          .modal-close {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
