'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { MenuItem, Badge, Location } from '@/lib/types';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

interface MenuItemModalProps {
  item: MenuItem;
  price: number | null;
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  /** Called when user wants to add an item with modifiers - parent handles the modifier modal */
  onOpenModifiers?: (item: MenuItem) => void;
}

// Badge display info
const BADGE_INFO: Partial<Record<Badge, { label: string; color: string }>> = {
  'Spicy': { label: 'Spicy', color: '#e74c3c' },
  'Vegetarian': { label: 'Vegetarian', color: '#27ae60' },
  'Gluten-Free': { label: 'Gluten-Free', color: '#8e44ad' },
  'Family Favorite': { label: 'Family Favorite', color: '#f39c12' },
  'Cajun': { label: 'Cajun', color: '#d35400' },
  'Fried': { label: 'Fried', color: '#c9a96a' },
  'Grilled': { label: 'Grilled', color: '#6d4c41' },
  'Boiled': { label: 'Boiled', color: '#3498db' },
  'Market Price': { label: 'Market Price', color: '#7f8c8d' },
};

/**
 * Full detail modal for menu items.
 * Accessible: focus trap, ESC closes, aria labels.
 * Includes placeholder for future modifiers.
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

  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Add ESC listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus close button
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = '';
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
      className="menu3-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu3-modal-title"
    >
      <div
        ref={modalRef}
        className="menu3-modal"
        role="document"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="menu3-modal-close"
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        {item.image && (
          <div className="menu3-modal-image">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="menu3-modal-content">
          {/* Name */}
          <h2
            id="menu3-modal-title"
            className="menu3-modal-name menu3-type-modal-name"
          >
            {item.name}
          </h2>

          {/* Price */}
          <div className="menu3-modal-price menu3-type-price">
            {price !== null ? (
              <>
                <span className="menu3-modal-price-dollar">$</span>
                {price.toFixed(2)}
              </>
            ) : (
              <span className="menu3-modal-price-mp">Market Price</span>
            )}
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="menu3-modal-badges">
              {badges.map(badge => {
                const info = BADGE_INFO[badge];
                return (
                  <span
                    key={badge}
                    className="menu3-modal-badge menu3-type-badge"
                    style={{ '--badge-color': info?.color || '#888' } as React.CSSProperties}
                  >
                    {info?.label || badge}
                  </span>
                );
              })}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="menu3-modal-description">
              {item.description}
            </p>
          )}

          {/* Actions */}
          <div className="menu3-modal-actions">
            <button
              type="button"
              className="menu3-modal-action-btn menu3-modal-action-btn--secondary"
              onClick={onClose}
            >
              Close
            </button>
            {item.modifierGroups && item.modifierGroups.length > 0 && onOpenModifiers ? (
              <button
                type="button"
                className="menu3-modal-action-btn menu3-modal-action-btn--primary"
                onClick={() => onOpenModifiers(item)}
              >
                Customize
              </button>
            ) : (
              <AddToCartButton
                menuItem={item}
                location={location}
                className="menu3-modal-action-btn menu3-modal-action-btn--primary"
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .menu3-modal-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          animation: modalBackdropFadeIn 0.2s ease-out;
        }

        @keyframes modalBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .menu3-modal {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 900px;
          max-height: 90vh;
          width: 100%;
          background: white;
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.25),
            0 10px 20px rgba(0, 0, 0, 0.15);
          animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Close button */
        .menu3-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 50%;
          color: var(--menu3-text, #333);
          cursor: pointer;
          z-index: 10;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .menu3-modal-close:hover {
          background: white;
          transform: scale(1.05);
        }

        .menu3-modal-close:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--menu3-accent, #333), 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Image */
        .menu3-modal-image {
          position: relative;
          min-height: 300px;
          background: var(--menu3-image-placeholder, #f5f5f5);
        }

        /* Content */
        .menu3-modal-content {
          display: flex;
          flex-direction: column;
          padding: 32px;
          overflow-y: auto;
        }

        .menu3-modal-name {
          margin: 0 0 8px;
          color: var(--menu3-text, #1a1a1a);
        }

        .menu3-modal-price {
          font-size: 22px;
          color: var(--menu3-text, #1a1a1a);
          margin-bottom: 16px;
        }

        .menu3-modal-price-dollar {
          font-size: 0.85em;
          opacity: 0.6;
        }

        .menu3-modal-price-mp {
          font-size: 0.85em;
          color: var(--menu3-text-muted, #888);
        }

        /* Badges */
        .menu3-modal-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .menu3-modal-badge {
          padding: 4px 10px;
          background: color-mix(in srgb, var(--badge-color) 12%, transparent);
          color: var(--badge-color);
          border-radius: 4px;
        }

        /* Description */
        .menu3-modal-description {
          font-family: var(--font-menu-ui);
          font-size: 15px;
          line-height: 1.65;
          color: var(--menu3-text-secondary, #555);
          margin: 0 0 24px;
        }

        /* Actions */
        .menu3-modal-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
        }

        .menu3-modal-action-btn {
          padding: 14px 24px;
          font-family: var(--font-menu-ui);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .menu3-modal-action-btn--secondary {
          background: var(--menu3-hover-bg, rgba(0, 0, 0, 0.05));
          color: var(--menu3-text, #333);
        }

        .menu3-modal-action-btn--secondary:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .menu3-modal-action-btn--primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--menu3-accent, #1a1a1a);
          color: white;
        }

        .menu3-modal-action-btn--primary:hover {
          background: #333;
        }

        .menu3-modal-action-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--menu3-accent, #333);
        }

        /* Mobile: single column */
        @media (max-width: 768px) {
          .menu3-modal {
            grid-template-columns: 1fr;
            max-height: 95vh;
          }

          .menu3-modal-image {
            min-height: 200px;
            max-height: 35vh;
          }

          .menu3-modal-content {
            padding: 24px;
          }

          .menu3-modal-close {
            top: 12px;
            right: 12px;
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
}
