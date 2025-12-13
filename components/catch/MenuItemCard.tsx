'use client';

import { useState, lazy, Suspense } from 'react';
import Image from "next/image";
import type { MenuItem, Location } from "@/lib/types";

const MenuItemModal = lazy(() => import('./MenuItemModal'));

interface MenuItemCardProps {
  menuItem: MenuItem;
  location: Location;
  name: string;
  description?: string;
  price?: number | null;
  image?: string;
  isAvailable?: boolean;
  badges?: string[];
  priority?: boolean;
}

export default function MenuItemCard({
  menuItem,
  location,
  name,
  description,
  price,
  image,
  isAvailable = true,
  badges,
  priority = false
}: MenuItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <style jsx>{`
        .premium-card {
          --pc-cream: #FAF7F2;
          --pc-cream-dark: #F0EBE3;
          --pc-cream-darker: #E8E2D9;
          --pc-gold: #C4A35A;
          --pc-gold-soft: rgba(196, 163, 90, 0.12);
          --pc-text: #2C2420;
          --pc-text-soft: #5C5450;
          --pc-text-muted: #8C8480;

          display: flex;
          flex-direction: column;
          background: var(--pc-cream);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 2px 8px rgba(44, 36, 32, 0.04),
            0 8px 24px rgba(44, 36, 32, 0.02);
        }

        :global(.dark) .premium-card {
          --pc-cream: #1C1917;
          --pc-cream-dark: #171412;
          --pc-cream-darker: #0F0D0B;
          --pc-gold: #D4B896;
          --pc-gold-soft: rgba(212, 184, 150, 0.1);
          --pc-text: #F5F2EF;
          --pc-text-soft: #B8B0A8;
          --pc-text-muted: #6B6560;

          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 8px 24px rgba(44, 36, 32, 0.08),
            0 20px 48px rgba(44, 36, 32, 0.06);
        }

        :global(.dark) .premium-card:hover {
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.25),
            0 20px 48px rgba(0, 0, 0, 0.2);
        }

        .premium-card:active {
          transform: translateY(-2px);
        }

        .premium-card--unavailable {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .premium-card--unavailable:hover {
          transform: none;
        }

        /* Image Container */
        .pc-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: linear-gradient(145deg, var(--pc-cream-dark) 0%, var(--pc-cream-darker) 100%);
        }

        .pc-image-container::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 60%,
            rgba(44, 36, 32, 0.02) 80%,
            rgba(44, 36, 32, 0.06) 100%
          );
          pointer-events: none;
        }

        /* Badges */
        .pc-badges {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 6px;
          z-index: 2;
        }

        .pc-badge {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 50%;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(44, 36, 32, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        :global(.dark) .pc-badge {
          background: rgba(28, 25, 23, 0.85);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* Content */
        .pc-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 16px 20px;
        }

        .pc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .pc-title {
          font-family: var(--font-lux-display);
          font-size: 18px;
          font-weight: 500;
          line-height: 1.25;
          color: var(--pc-text);
          margin: 0;
          flex: 1;
          letter-spacing: -0.01em;
        }

        .pc-price {
          font-family: var(--font-lux-body);
          font-size: 16px;
          font-weight: 700;
          color: var(--pc-text);
          white-space: nowrap;
          padding: 4px 10px;
          background: var(--pc-gold-soft);
          border-radius: 12px;
          letter-spacing: 0.02em;
        }

        .pc-description {
          font-family: var(--font-lux-body);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          color: var(--pc-text-muted);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Hover accent line */
        .pc-accent-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--pc-gold) 0%, var(--pc-gold-soft) 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-card:hover .pc-accent-line {
          transform: scaleX(1);
        }

        /* Focus states for accessibility */
        .premium-card:focus-visible {
          outline: 2px solid var(--pc-gold);
          outline-offset: 2px;
        }

        @media (max-width: 600px) {
          .pc-title {
            font-size: 15px;
          }

          .pc-price {
            font-size: 14px;
            padding: 3px 8px;
          }

          .pc-description {
            font-size: 13px;
            -webkit-line-clamp: 2;
          }

          .pc-content {
            padding: 12px 12px 16px;
            gap: 8px;
          }

          .pc-badge {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-card,
          .pc-accent-line {
            transition: none;
          }

          .premium-card:hover {
            transform: none;
          }
        }
      `}</style>

      <article
        className={`premium-card ${!isAvailable ? 'premium-card--unavailable' : ''}`}
        style={{ position: 'relative' }}
        onClick={() => isAvailable && setIsModalOpen(true)}
        role="button"
        tabIndex={isAvailable ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <div className="pc-image-container">
          <Image
            src={image ?? "/images/placeholder-efefef.jpg"}
            alt={name}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
          />
          {badges && badges.length > 0 && (
            <div className="pc-badges">
              {badges.slice(0, 3).map((badge, i) => (
                <span key={i} className="pc-badge" title={badge}>
                  {badge === "Gluten-Free" && "🌾"}
                  {badge === "Vegetarian" && "🌱"}
                  {badge === "Spicy" && "🌶️"}
                  {badge === "Family Favorite" && "⭐"}
                  {badge === "Cajun" && "🎺"}
                  {badge === "Fried" && "🍤"}
                  {badge === "Grilled" && "🔥"}
                  {badge === "Boiled" && "🦞"}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pc-content">
          <div className="pc-header">
            <h3 className="pc-title">{name}</h3>
            {price != null && (
              <span className="pc-price">${price.toFixed(0)}</span>
            )}
          </div>
          {description && (
            <p className="pc-description">{description}</p>
          )}
        </div>

        <div className="pc-accent-line" />
      </article>

      {isModalOpen && (
        <Suspense fallback={null}>
          <MenuItemModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            menuItem={menuItem}
            location={location}
            name={name}
            description={description}
            price={price}
            image={image}
            badges={badges}
          />
        </Suspense>
      )}
    </>
  );
}
