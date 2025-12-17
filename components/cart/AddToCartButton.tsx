'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { LocationSwitchModal } from './LocationSwitchModal';
import ModifierSelectionModal from './ModifierSelectionModal';
import type { MenuItem, Location, CartModifier } from '@/lib/types';

interface AddToCartButtonProps {
  menuItem: MenuItem;
  location: Location;
  className?: string;
  disabled?: boolean;
}

/**
 * Helper function to validate if a menu item has a valid price
 * Price must be defined, not null, be a number, and >= 0
 */
function isValidPrice(price: number | null | undefined): price is number {
  return price !== null && price !== undefined && Number.isFinite(price) && price >= 0;
}

/**
 * Render an "Add to Cart" button that adds the provided menu item to the cart
 * and prompts to switch locations when necessary.
 *
 * @param menuItem - The menu item to add when the button is pressed.
 * @param location - The location to associate with the cart addition.
 * @param className - Optional additional CSS class names to apply to the button.
 * @param disabled - If `true`, the button is rendered disabled and interaction is prevented.
 * @returns The button element plus any modals used for location switching and modifier selection.
 */
export function AddToCartButton({
  menuItem,
  location,
  className = '',
  disabled = false,
}: AddToCartButtonProps) {
  const { cart, addToCart, clearCart, canAddFromLocation, isHydrated } = useCart();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);

  const hasModifiers = menuItem.modifierGroups && menuItem.modifierGroups.length > 0;

  const handleAddToCart = () => {
    // Don't allow adding before hydration
    if (!isHydrated || !cart) {
      return;
    }

    // Validate price before adding to cart
    if (!isValidPrice(menuItem.price)) {
      return;
    }

    // Check if location can accept this item
    if (!canAddFromLocation(location._id)) {
      // Show modal to confirm location switch
      setShowLocationModal(true);
      return;
    }

    // If item has modifiers, show modifier selection modal
    // (Note: Items with modifiers should go directly to ModifierSelectionModal
    // from MenuList, but this handles edge cases)
    if (hasModifiers) {
      setShowModifierModal(true);
      return;
    }

    // Quick add for items without modifiers
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );

    // Cart badge animation provides sufficient feedback
  };

  const handleModifierAddToCart = (modifiers: CartModifier[], specialInstructions: string, quantity: number) => {
    if (!isHydrated || !cart) return;
    if (!isValidPrice(menuItem.price)) return;

    // Calculate total price including modifiers
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
    const itemPrice = menuItem.price + modifierTotal;

    addToCart(
      {
        menuItem,
        quantity,
        price: itemPrice,
        modifiers,
        specialInstructions: specialInstructions || undefined,
      },
      location
    );

    setShowModifierModal(false);
    // Cart badge animation provides sufficient feedback
  };

  const handleConfirmSwitch = () => {
    // Validate price before adding to cart
    if (!isValidPrice(menuItem.price)) {
      console.warn('Cannot add item with invalid price:', menuItem.name);
      return;
    }

    clearCart();
    setShowLocationModal(false);

    // If item has modifiers, show modifier modal after clearing cart
    if (hasModifiers) {
      setShowModifierModal(true);
      return;
    }

    // Quick add for items without modifiers
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );
    // Cart badge animation provides sufficient feedback
  };

  // Don't show button if no price (market price or unavailable)
  if (!isValidPrice(menuItem.price)) {
    return (
      <button className={`add-to-cart-btn add-to-cart-btn-disabled ${className}`} disabled>
        See Menu for Price
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={disabled || !isHydrated}
        className={`add-to-cart-btn ${className}`}
        aria-label={`Add ${menuItem.name} to cart`}
      >
        <ShoppingCart size={18} />
        <span>Add to Cart</span>
      </button>

      {cart?.location && (
        <LocationSwitchModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          currentLocation={cart.location}
          newLocation={location}
          onConfirm={handleConfirmSwitch}
        />
      )}

      <ModifierSelectionModal
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        onAddToCart={handleModifierAddToCart}
        menuItem={menuItem}
      />
    </>
  );
}
