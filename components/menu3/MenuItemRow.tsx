'use client';

import React, { forwardRef } from 'react';
import type { MenuItem, Badge } from '@/lib/types';

interface MenuItemRowProps {
  item: MenuItem;
  price: number | null;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
  className?: string;
}

// Badge icons (simplified inline SVGs)
const BADGE_ICONS: Partial<Record<Badge, React.ReactNode>> = {
  'Spicy': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM12 8C9.24 8 7 10.24 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 10.24 14.76 8 12 8ZM12 16C10.34 16 9 14.66 9 13C9 11.34 10.34 10 12 10C13.66 10 15 11.34 15 13C15 14.66 13.66 16 12 16Z"/>
    </svg>
  ),
  'Vegetarian': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
    </svg>
  ),
  'Gluten-Free': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <text x="4" y="16" fontSize="12" fontWeight="bold">GF</text>
    </svg>
  ),
  'Family Favorite': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
    </svg>
  ),
};

/**
 * Single menu item row with premium typography.
 * Typography-driven: Louize Italic name, price alignment, quiet description.
 */
export const MenuItemRow = forwardRef<HTMLButtonElement, MenuItemRowProps>(
  function MenuItemRow(
    { item, price, isHovered, onHover, onLeave, onFocus, onBlur, onClick, className = '' },
    ref
  ) {
    const hasImage = Boolean(item.image);
    const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;
    const badges = item.badges?.slice(0, 2); // Show max 2 badges inline

    return (
      <button
        ref={ref}
        type="button"
        className={`menu3-item-row ${isHovered ? 'is-hovered' : ''} ${className}`}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        aria-label={`${item.name}${price != null ? `, $${price.toFixed(2)}` : ''}`}
      >
        {/* Image indicator (subtle) */}
        {hasImage && (
          <span className="menu3-item-image-dot" aria-hidden="true" />
        )}

        {/* Name + badges */}
        <span className="menu3-item-name-container">
          <span className="menu3-item-name menu3-type-item-name">
            {item.name}
          </span>
          {badges && badges.length > 0 && (
            <span className="menu3-item-badges" aria-label="Item badges">
              {badges.map(badge => (
                <span
                  key={badge}
                  className="menu3-item-badge"
                  title={badge}
                  aria-hidden="true"
                >
                  {BADGE_ICONS[badge] || badge.charAt(0)}
                </span>
              ))}
            </span>
          )}
          {hasModifiers && (
            <span className="menu3-item-customize" title="Customizable" aria-label="Has options">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </span>
          )}
        </span>

        {/* Description (truncated) */}
        {item.description && (
          <span className="menu3-item-description menu3-type-description">
            {item.description}
          </span>
        )}

        {/* Spacer line */}
        <span className="menu3-item-spacer" aria-hidden="true" />

        {/* Price */}
        <span className="menu3-item-price menu3-type-price">
          {price !== null ? (
            <>
              <span className="menu3-price-dollar">$</span>
              {price.toFixed(2)}
            </>
          ) : (
            <span className="menu3-price-mp">MP</span>
          )}
        </span>

        <style jsx>{`
          .menu3-item-row {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            grid-template-rows: auto auto;
            gap: 0 12px;
            align-items: baseline;
            width: 100%;
            padding: 12px 0;
            background: transparent;
            border: none;
            border-bottom: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.04));
            cursor: pointer;
            text-align: left;
            transition: background 0.15s ease;
          }

          .menu3-item-row:hover,
          .menu3-item-row.is-hovered {
            background: var(--menu3-hover-bg, rgba(0, 0, 0, 0.015));
          }

          .menu3-item-row:focus-visible {
            outline: none;
            background: var(--menu3-hover-bg, rgba(0, 0, 0, 0.02));
            box-shadow: inset 0 0 0 2px var(--menu3-accent, #333);
          }

          /* Image indicator dot */
          .menu3-item-image-dot {
            grid-column: 1;
            grid-row: 1;
            width: 6px;
            height: 6px;
            background: var(--menu3-accent, #333);
            border-radius: 50%;
            margin-top: 7px;
            opacity: 0.4;
          }

          .menu3-item-row:hover .menu3-item-image-dot,
          .menu3-item-row.is-hovered .menu3-item-image-dot {
            opacity: 1;
          }

          /* Name container */
          .menu3-item-name-container {
            grid-column: 2;
            grid-row: 1;
            display: flex;
            align-items: baseline;
            gap: 8px;
            min-width: 0;
          }

          .menu3-item-name {
            color: var(--menu3-text, #1a1a1a);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .menu3-item-row:hover .menu3-item-name,
          .menu3-item-row.is-hovered .menu3-item-name {
            color: var(--menu3-accent, #000);
          }

          /* Badges */
          .menu3-item-badges {
            display: inline-flex;
            gap: 4px;
            flex-shrink: 0;
          }

          .menu3-item-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            color: var(--menu3-text-muted, #888);
            opacity: 0.6;
          }

          /* Customizable indicator */
          .menu3-item-customize {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--menu3-text-muted, #999);
            opacity: 0.35;
            margin-left: 2px;
            transition: opacity 0.15s ease;
          }

          .menu3-item-row:hover .menu3-item-customize,
          .menu3-item-row.is-hovered .menu3-item-customize {
            opacity: 0.7;
          }

          /* Description */
          .menu3-item-description {
            grid-column: 2;
            grid-row: 2;
            margin-top: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }

          /* Spacer (dotted line) */
          .menu3-item-spacer {
            grid-column: 3;
            grid-row: 1;
            flex: 1;
            height: 1px;
            min-width: 20px;
            background: repeating-linear-gradient(
              90deg,
              var(--menu3-border, rgba(0, 0, 0, 0.1)) 0,
              var(--menu3-border, rgba(0, 0, 0, 0.1)) 2px,
              transparent 2px,
              transparent 6px
            );
            margin: 0 8px;
            align-self: center;
          }

          /* Price */
          .menu3-item-price {
            grid-column: 4;
            grid-row: 1;
            color: var(--menu3-text, #1a1a1a);
            white-space: nowrap;
          }

          .menu3-price-dollar {
            font-size: 0.85em;
            opacity: 0.6;
          }

          .menu3-price-mp {
            font-size: 0.8em;
            letter-spacing: 0.05em;
            color: var(--menu3-text-muted, #888);
          }

          /* Compact mode for dense display */
          @media (max-width: 1200px) {
            .menu3-item-description {
              display: none;
            }

            .menu3-item-row {
              grid-template-rows: auto;
              padding: 10px 0;
            }
          }

          /* Mobile */
          @media (max-width: 768px) {
            .menu3-item-row {
              padding: 14px 0;
            }

            .menu3-item-spacer {
              display: none;
            }

            .menu3-item-name-container {
              grid-column: 1 / 4;
            }

            .menu3-item-price {
              grid-column: 4;
            }

            .menu3-item-image-dot {
              display: none;
            }
          }
        `}</style>
      </button>
    );
  }
);
