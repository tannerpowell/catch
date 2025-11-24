'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Location, CartItem, Cart, MenuItem } from '@/lib/types';

interface CartContextType {
  cart: Cart | null;
  addToCart: (item: CartItem, location: Location) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setTip: (amount: number) => void;
  clearCart: () => void;
  isLocationLocked: boolean;
  canAddFromLocation: (locationId: string) => boolean;
  itemCount: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'catch-cart';

/**
 * Factory function to create an empty cart object
 * Used for initialization and clearing cart state
 */
function getEmptyCart(): Cart {
  return {
    location: null,
    locationId: null,
    items: [],
    subtotal: 0,
    tax: 0,
    tip: 0,
    deliveryFee: 0,
    total: 0,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize cart as null to match SSR initial state
  const [cart, setCart] = useState<Cart | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(parsed);
        } else {
          // No saved cart, initialize empty cart
          setCart(getEmptyCart());
        }
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
        // Fallback to empty cart on error
        setCart(getEmptyCart());
      }
      setIsHydrated(true);
    }
  }, []);

  // Calculate totals whenever cart items, tip, or location changes
  useEffect(() => {
    if (!isHydrated || !cart) return;

    const subtotal = cart.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const modifierTotal = item.modifiers.reduce((modSum, mod) => modSum + (mod.priceDelta * item.quantity), 0);
      return sum + itemTotal + modifierTotal;
    }, 0);

    const taxRate = cart.location?.taxRate || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax + cart.tip + cart.deliveryFee;

    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    });
  }, [cart?.items, cart?.tip, cart?.deliveryFee, cart?.location, isHydrated]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  const addToCart = useCallback((item: CartItem, location: Location) => {
    setCart((prev) => {
      // Before hydration, shouldn't add to cart
      if (!prev) {
        console.warn('Cannot add to cart before hydration complete');
        return prev;
      }

      // If cart is empty or same location, add item
      if (!prev.locationId || prev.locationId === location._id) {
        return {
          ...prev,
          location,
          locationId: location._id,
          items: [...prev.items, item],
        };
      }

      // Different location - this should be prevented by UI, but handle gracefully
      console.warn('Attempted to add item from different location. Use LocationSwitchModal first.');
      return prev;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => {
      if (!prev) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);

      // If cart is now empty, clear location lock
      if (newItems.length === 0) {
        return getEmptyCart();
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item, i) => (i === index ? { ...item, quantity } : item)),
      };
    });
  }, [removeFromCart]);

  const setTip = useCallback((amount: number) => {
    setCart((prev) => {
      if (!prev) return prev;
      return { ...prev, tip: Math.max(0, amount) };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart(getEmptyCart());
  }, []);

  const isLocationLocked = cart?.locationId !== null && cart?.locationId !== undefined;

  const canAddFromLocation = useCallback(
    (locationId: string) => {
      return !cart?.locationId || cart.locationId === locationId;
    },
    [cart?.locationId]
  );

  const itemCount = cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setTip,
        clearCart,
        isLocationLocked,
        canAddFromLocation,
        itemCount,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
