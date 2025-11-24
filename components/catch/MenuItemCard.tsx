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
}

export default function MenuItemCard({ menuItem, location, name, description, price, image, isAvailable = true, badges }: MenuItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <article
        className="catch-menu-card"
        style={{ opacity: isAvailable ? 1 : 0.6, cursor: isAvailable ? 'pointer' : 'default', position: 'relative', zIndex: 1 }}
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
        <div className="catch-menu-card-image">
          <Image
            src={image || "/images/placeholder-efefef.jpg"}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="catch-menu-card-content">
          <div className="catch-menu-card-header">
            <h3 className="catch-menu-card-title">{name}</h3>
            {badges && badges.length > 0 && (
              <div className="catch-menu-card-badges">
                {badges.map((badge, i) => (
                  <span key={i} className="catch-menu-badge" title={badge}>
                    {badge === "Gluten-Free" && "🌾"}
                    {badge === "Vegetarian" && "🌱"}
                    {badge === "Spicy" && "🌶️"}
                    {badge === "Family Favorite" && "⭐"}
                  </span>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="catch-menu-card-description">{description}</p>
          )}
          {price != null && (
            <p className="catch-menu-card-price">${price.toFixed(0)}</p>
          )}
        </div>
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
