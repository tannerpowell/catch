'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from './MenuItemModal.module.css';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { MenuItem, Location } from '@/lib/types';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  location: Location;
  name: string;
  description?: string;
  price?: number | null;
  image?: string;
  badges?: string[];
}

/**
 * Renders a modal dialog showing a menu item's image, badges, description, price, and an Add to Cart button.
 *
 * While open, disables page scroll and closes when the overlay is clicked or the Escape key is pressed.
 *
 * @param isOpen - Controls whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param menuItem - Menu item data passed to the AddToCartButton
 * @param location - Location context passed to the AddToCartButton
 * @param name - Title shown at the top of the modal
 * @param description - Optional descriptive text for the menu item
 * @param price - Optional price displayed; rendered when not null
 * @param image - Optional image URL; a placeholder is used when omitted
 * @param badges - Optional list of badge labels to render alongside emoji indicators
 * @returns The modal React element when open, or `null` when closed
 */
export default function MenuItemModal({
  isOpen,
  onClose,
  menuItem,
  location,
  name,
  description,
  price,
  image,
  badges
}: MenuItemModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Outer layer for depth */}
        <div className={styles.outerLayer}>
          {/* Inner card */}
          <div className={styles.innerCard}>
            {/* Close button */}
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Image section */}
            <div className={styles.imageSection}>
              <div className={styles.imageFrame}>
                <Image
                  src={image ?? "/images/placeholder-efefef.jpg"}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 600px"
                  style={{ objectFit: "cover" }}
                  loading="eager"
                />
              </div>
            </div>

            {/* Content section */}
            <div className={styles.content}>
              <div className={styles.header}>
                <h2 id="modal-title" className={styles.title}>{name}</h2>
                {badges && badges.length > 0 && (
                  <div className={styles.badges}>
                    {badges.map((badge, i) => (
                      <span key={i} className={styles.badge} title={badge}>
                        {badge === "Gluten-Free" && "🌾"}
                        {badge === "Vegetarian" && "🌱"}
                        {badge === "Spicy" && "🌶️"}
                        {badge === "Family Favorite" && "⭐"}
                        {badge === "Cajun" && "🎺"}
                        {badge === "Fried" && "🍤"}
                        {badge === "Grilled" && "🔥"}
                        {badge === "Boiled" && "🦞"}
                        <span className={styles.badgeLabel}>{badge}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {description && (
                <p className={styles.description}>{description}</p>
              )}

              {price != null && (
                <div className={styles.priceSection}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.price}>{price.toFixed(0)}</span>
                </div>
              )}

              {/* Add to Cart Button */}
              <div style={{ marginTop: '24px' }}>
                <AddToCartButton menuItem={menuItem} location={location} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}