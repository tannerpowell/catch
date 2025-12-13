'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { MenuItem, Location, CartModifier } from '@/lib/types';
import { MenuItemRow } from './MenuItemRow';
import { MenuItemModal } from './MenuItemModal';
import ModifierSelectionModal from '@/components/cart/ModifierSelectionModal';
import { useCart } from '@/lib/contexts/CartContext';
import { isItemAvailableAtLocation, getItemPriceAtLocation } from '@/lib/utils/menuAvailability';
import { slugify } from '@/lib/utils/slugify';

interface MenuListProps {
  items: MenuItem[];
  locations: Location[];
  selectedLocationSlug: string;
  searchTerm: string;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  onItemHover: (item: MenuItem | null, price: number | null) => void;
  imageMap: Record<string, string>;
}

/**
 * Menu list with MixItUp filtering.
 * Renders all items with data attributes for filtering.
 * Handles hover state and modal opening.
 */
export function MenuList({
  items,
  locations,
  selectedLocationSlug,
  searchTerm,
  containerRef,
  onItemHover,
  imageMap,
}: MenuListProps) {
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalPrice, setModalPrice] = useState<number | null>(null);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const { addToCart } = useCart();
  const selectedLocation = locations.find(l => l.slug === selectedLocationSlug) || locations[0];

  // Prepare items with images and metadata
  const preparedItems = useMemo(() => {
    return items.map(item => {
      const itemSlug = item.slug || slugify(item.name);
      let bestImage = item.image;
      if (imageMap[itemSlug]) {
        bestImage = imageMap[itemSlug];
      }

      return {
        ...item,
        image: bestImage,
        itemSlug,
      };
    });
  }, [items, imageMap]);

  // Build MixItUp classes for each item
  const getItemClasses = useCallback((item: MenuItem) => {
    const classes = ['mix-item'];

    // Add category class
    classes.push(`category-${item.categorySlug}`);

    // Add location classes for all locations where item is available
    for (const loc of locations) {
      if (isItemAvailableAtLocation(item, loc.slug)) {
        classes.push(`location-${loc.slug}`);
      }
    }

    return classes.join(' ');
  }, [locations]);

  // Handle item hover with delay
  const handleItemHover = useCallback((item: MenuItem, price: number | null) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set hover with slight delay to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItemId(item.id);
      onItemHover(item, price);
    }, 80);
  }, [onItemHover]);

  const handleItemLeave = useCallback(() => {
    // Clear any pending hover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Delay clearing to allow moving to peek preview
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItemId(null);
      onItemHover(null, null);
    }, 150);
  }, [onItemHover]);

  // Handle item click - always show detail modal first
  const handleItemClick = useCallback((item: MenuItem, price: number | null) => {
    setModalItem(item);
    setModalPrice(price);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalItem(null);
    setModalPrice(null);
  }, []);

  // Handle request to open modifier modal from detail modal
  const handleOpenModifiers = useCallback((item: MenuItem) => {
    setModalItem(null); // Close detail modal
    setModalPrice(null);
    setModifierItem(item); // Open modifier modal
  }, []);

  // Handle modifier modal add to cart
  const handleModifierAddToCart = useCallback((modifiers: CartModifier[], specialInstructions: string, quantity: number) => {
    if (!modifierItem) return;

    // Use location-specific pricing
    const basePrice = getItemPriceAtLocation(modifierItem, selectedLocationSlug);
    if (basePrice == null) return;

    const modifierTotal = modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
    const itemPrice = basePrice + modifierTotal;

    addToCart(
      {
        menuItem: modifierItem,
        quantity,
        price: itemPrice,
        modifiers,
        specialInstructions: specialInstructions || undefined,
      },
      selectedLocation
    );

    setModifierItem(null);
  }, [modifierItem, addToCart, selectedLocation, selectedLocationSlug]);

  // Normalize search term
  const normalizedSearch = searchTerm.toLowerCase().trim();

  return (
    <>
      <div
        ref={containerRef}
        className="menu3-list"
        role="list"
        aria-label="Menu items"
      >
        {preparedItems.map(item => {
          const price = getItemPriceAtLocation(item, selectedLocationSlug);
          const isHovered = hoveredItemId === item.id;

          // Check search filter (client-side, in addition to MixItUp)
          const matchesSearch = !normalizedSearch ||
            item.name.toLowerCase().includes(normalizedSearch) ||
            (item.description?.toLowerCase().includes(normalizedSearch) ?? false);

          return (
            <div
              key={item.id}
              className={`${getItemClasses(item)} ${matchesSearch ? '' : 'search-hidden'}`}
              data-name={item.name}
              data-description={item.description || ''}
            >
              <MenuItemRow
                item={item}
                price={price}
                isHovered={isHovered}
                onHover={() => handleItemHover(item, price)}
                onLeave={handleItemLeave}
                onFocus={() => handleItemHover(item, price)}
                onBlur={handleItemLeave}
                onClick={() => handleItemClick(item, price)}
              />
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {modalItem && (
        <MenuItemModal
          item={modalItem}
          price={modalPrice}
          isOpen={true}
          onClose={handleModalClose}
          location={selectedLocation}
          onOpenModifiers={handleOpenModifiers}
        />
      )}

      {/* Modifier Modal - for items with modifiers */}
      {modifierItem && (
        <ModifierSelectionModal
          isOpen={true}
          onClose={() => setModifierItem(null)}
          onAddToCart={handleModifierAddToCart}
          menuItem={modifierItem}
        />
      )}

      <style jsx>{`
        .menu3-list {
          display: flex;
          flex-direction: column;
        }

        /* MixItUp hidden items */
        .menu3-list :global(.mix-item) {
          display: block;
        }

        /* Search hidden items */
        .menu3-list :global(.search-hidden) {
          display: none !important;
        }

        /* MixItUp filtering animation states */
        .menu3-list :global(.mix-item[style*="display: none"]) {
          /* Already handled by MixItUp */
        }
      `}</style>
    </>
  );
}
