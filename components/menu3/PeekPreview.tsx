'use client';

import React from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { BADGE_INFO } from '@/lib/constants/badges';

interface PeekPreviewProps {
  item: MenuItem | null;
  price: number | null;
  /** 'dock' for right pane, 'float' for overlay */
  mode: 'dock' | 'float';
  /** Position for floating mode */
  floatPosition?: { top: number; left: number };
  onClose?: () => void;
}

/**
 * Peek preview card shown on hover/focus.
 * Supports two modes:
 * - dock: Renders in the right pane (desktop)
 * - float: Renders as a floating overlay (tablet/narrow)
 *
 * Premium surface: radius 14-18px, faint border, layered shadow.
 */
export function PeekPreview({
  item,
  price,
  mode,
  floatPosition,
  onClose,
}: PeekPreviewProps) {
  if (!item) {
    if (mode === 'dock') {
      // Show empty state for dock mode
      return (
        <div className="menu3-peek-empty">
          <div className="menu3-peek-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            </svg>
          </div>
          <p className="menu3-peek-empty-text">
            Hover over an item to preview
          </p>

          <style jsx>{`
            .menu3-peek-empty {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              min-height: 240px;
              padding: 40px;
              text-align: center;
            }

            .menu3-peek-empty-icon {
              color: var(--menu3-text-muted, #aaa);
              opacity: 0.4;
              margin-bottom: 16px;
            }

            .menu3-peek-empty-text {
              font-family: var(--font-menu-ui);
              font-size: 14px;
              color: var(--menu3-text-muted, #888);
              margin: 0;
            }

            :global(.dark) .menu3-peek-empty-icon {
              color: var(--menu3-text-muted, #555);
            }

            :global(.dark) .menu3-peek-empty-text {
              color: var(--menu3-text-muted, #666);
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  const badges = item.badges?.slice(0, 4);

  // Use inline styles for float positioning to avoid styled-jsx template recalculation
  // Clamp to viewport bounds to prevent off-screen positioning
  const floatStyles = mode === 'float' ? (() => {
    const cardWidth = 260;
    const cardHeight = 350; // Approximate max height
    const padding = 16;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    const top = Math.min(
      Math.max(floatPosition?.top ?? 100, padding),
      viewportHeight - cardHeight - padding
    );
    const left = Math.min(
      Math.max(floatPosition?.left ?? 100, padding),
      viewportWidth - cardWidth - padding
    );

    return { top, left };
  })() : undefined;

  const content = (
    <div
      className={`menu3-peek ${mode === 'float' ? 'menu3-peek--float' : 'menu3-peek--dock'}`}
      style={floatStyles}
    >
      {/* Image */}
      {item.image && (
        <div className="menu3-peek-image">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes={mode === 'dock' ? '280px' : '200px'}
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="menu3-peek-content">
        {/* Name */}
        <h3 className="menu3-peek-name menu3-type-peek-name">
          {item.name}
        </h3>

        {/* Price */}
        <div className="menu3-peek-price menu3-type-price">
          {price !== null ? (
            <>
              <span className="menu3-peek-price-dollar">$</span>
              {price.toFixed(2)}
            </>
          ) : (
            <span className="menu3-peek-price-mp">Market Price</span>
          )}
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="menu3-peek-badges">
            {badges.map(badge => {
              const info = BADGE_INFO[badge];
              return (
                <span
                  key={badge}
                  className="menu3-peek-badge menu3-type-badge"
                  style={{ '--badge-color': `var(${info?.cssVar || '--color-tierra-muted'})` } as React.CSSProperties}
                >
                  {info?.label || badge}
                </span>
              );
            })}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="menu3-peek-description menu3-type-description">
            {item.description}
          </p>
        )}

        {/* Click hint */}
        <div className="menu3-peek-hint menu3-type-section">
          Click for details
        </div>
      </div>

      {/* Close button for float mode */}
      {mode === 'float' && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="menu3-peek-close"
          aria-label="Close preview"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .menu3-peek {
          background: var(--menu3-card-bg, white);
          border: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.06));
          overflow: hidden;
        }

        .menu3-peek--dock {
          border-radius: 16px;
          box-shadow:
            0 1px 2px rgba(50, 39, 35, 0.04),
            0 4px 12px rgba(50, 39, 35, 0.06),
            0 12px 24px rgba(50, 39, 35, 0.06);
        }

        .menu3-peek--float {
          position: fixed;
          /* top/left set via inline styles to avoid recalculation */
          width: 260px;
          border-radius: 16px;
          box-shadow:
            0 4px 6px rgba(50, 39, 35, 0.06),
            0 10px 20px rgba(50, 39, 35, 0.08),
            0 20px 40px rgba(50, 39, 35, 0.1);
          z-index: 1000;
          animation: peekFadeIn 0.2s ease-out;
        }

        @keyframes peekFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Image */
        .menu3-peek-image {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          background: var(--menu3-image-placeholder, #f5f5f5);
        }

        /* Content */
        .menu3-peek-content {
          padding: 20px;
        }

        .menu3-peek-name {
          margin: 0 0 6px;
          color: var(--menu3-text, #1a1a1a);
        }

        .menu3-peek-price {
          color: var(--menu3-text, #1a1a1a);
          margin-bottom: 12px;
        }

        .menu3-peek-price-dollar {
          font-size: 0.85em;
          opacity: 0.6;
        }

        .menu3-peek-price-mp {
          font-size: 0.8em;
          color: var(--menu3-text-muted, #888);
        }

        /* Badges */
        .menu3-peek-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .menu3-peek-badge {
          padding: 3px 8px;
          /* Fallback for browsers without color-mix() support */
          background: rgba(128, 128, 128, 0.12);
          background: color-mix(in srgb, var(--badge-color) 12%, transparent);
          color: var(--badge-color);
          border-radius: 4px;
        }

        /* Description */
        .menu3-peek-description {
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: var(--menu3-text-muted, #5a5a5a);
        }

        /* Hint */
        .menu3-peek-hint {
          color: var(--menu3-text-muted, #888);
          opacity: 0.6;
        }

        /* Dark mode */
        :global(.dark) .menu3-peek {
          background: var(--menu3-card-bg, #1a1a1a);
          border-color: rgba(255, 255, 255, 0.08);
        }

        :global(.dark) .menu3-peek-name {
          color: var(--menu3-text, #f0f0f0);
        }

        :global(.dark) .menu3-peek-price {
          color: var(--menu3-text, #f0f0f0);
        }

        :global(.dark) .menu3-peek-description {
          color: var(--menu3-text-muted, #999);
        }

        :global(.dark) .menu3-peek-hint {
          color: var(--menu3-text-muted, #666);
        }

        :global(.dark) .menu3-peek-image {
          background: var(--menu3-image-placeholder, #222);
        }

        /* Close button */
        .menu3-peek-close {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          color: var(--menu3-text, #333);
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: all 0.15s ease;
        }

        .menu3-peek-close:hover {
          background: white;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );

  return content;
}
