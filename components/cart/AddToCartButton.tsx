'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { LocationSwitchModal } from './LocationSwitchModal';
import { SuccessModal } from './SuccessModal';
import type { MenuItem, Location } from '@/lib/types';

interface AddToCartButtonProps {
  menuItem: MenuItem;
  location: Location;
  className?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  menuItem,
  location,
  className = '',
  disabled = false,
}: AddToCartButtonProps) {
  const { cart, addToCart, clearCart, canAddFromLocation, isHydrated } = useCart();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddToCart = () => {
    // Don't allow adding before hydration
    if (!isHydrated || !cart) {
      console.warn('Cannot add to cart before hydration complete');
      return;
    }

    // Validate price exists and is a number (allow 0)
    if (menuItem.price == null || typeof menuItem.price !== 'number') {
      console.warn('Cannot add item without valid price');
      return;
    }

    // Check if location can accept this item
    if (!canAddFromLocation(location._id)) {
      // Show modal to confirm location switch
      setShowLocationModal(true);
      return;
    }

    // Add to cart with validated price
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );

    // Show success modal
    setShowSuccessModal(true);
  };

  const handleConfirmSwitch = () => {
    // Validate price before switching
    if (menuItem.price == null || typeof menuItem.price !== 'number') {
      console.warn('Cannot add item without valid price');
      return;
    }

    clearCart();
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );
    setShowSuccessModal(true);
  };

  // Don't show button if no price (market price or unavailable)
  // Explicitly check for null/undefined, allow 0
  if (menuItem.price == null || typeof menuItem.price !== 'number') {
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

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        itemName={menuItem.name}
      />
    </>
  );
}

