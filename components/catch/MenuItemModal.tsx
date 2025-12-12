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
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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

        <div className={styles.modalInner}>
          {/* Image section - left side on desktop */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <Image
                src={image ?? "/images/placeholder-efefef.jpg"}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                loading="eager"
                priority
              />
              {/* Subtle gradient overlay */}
              <div className={styles.imageOverlay} />
            </div>
          </div>

          {/* Content section - right side on desktop */}
          <div className={styles.contentSection}>
            <div className={styles.contentInner}>
              {/* Badges */}
              {badges && badges.length > 0 && (
                <div className={styles.badgesRow}>
                  {badges.map((badge, i) => (
                    <span key={i} className={styles.badge} title={badge}>
                      <span className={styles.badgeEmoji}>
                        {badge === "Gluten-Free" && "🌾"}
                        {badge === "Vegetarian" && "🌱"}
                        {badge === "Spicy" && "🌶️"}
                        {badge === "Family Favorite" && "⭐"}
                        {badge === "Cajun" && "🎺"}
                        {badge === "Fried" && "🍤"}
                        {badge === "Grilled" && "🔥"}
                        {badge === "Boiled" && "🦞"}
                      </span>
                      <span className={styles.badgeText}>{badge}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 id="modal-title" className={styles.title}>{name}</h2>

              {/* Description */}
              {description && (
                <p className={styles.description}>{description}</p>
              )}

              {/* Decorative divider */}
              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerIcon}>✦</span>
                <span className={styles.dividerLine} />
              </div>

              {/* Price */}
              {price != null && (
                <div className={styles.priceBlock}>
                  <span className={styles.priceLabel}>Price</span>
                  <div className={styles.priceValue}>
                    <span className={styles.priceCurrency}>$</span>
                    <span className={styles.priceAmount}>{price.toFixed(0)}</span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className={styles.actionBlock}>
                <AddToCartButton menuItem={menuItem} location={location} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
