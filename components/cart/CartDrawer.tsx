'use client';

import { useCart } from '@/lib/contexts/CartContext';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, itemCount, isHydrated } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="cart-drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-content">
            <ShoppingCart size={24} />
            <h2 className="cart-drawer-title">
              Your Cart
              {itemCount > 0 && <span className="cart-item-count">({itemCount})</span>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cart-drawer-close"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-content">
          {!isHydrated ? (
            <div className="cart-empty">
              <ShoppingCart size={64} className="cart-empty-icon" />
              <p className="cart-empty-text">Loading cart...</p>
            </div>
          ) : !cart || !cart.items || cart.items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={64} className="cart-empty-icon" />
              <p className="cart-empty-text">Your cart is empty</p>
              <p className="cart-empty-subtext">Add items from the menu to get started</p>
            </div>
          ) : (
            <>
              {/* Location Badge */}
              {cart.location && (
                <div className="cart-location-info">
                  <div className="cart-location-badge">
                    <div className="cart-location-main">
                      <span className="cart-location-icon">📍</span>
                      <div className="cart-location-details">
                        <strong className="cart-location-name">{cart.location.name}</strong>
                        <span className="cart-location-address">
                          {cart.location.addressLine1}
                          {cart.location.city && `, ${cart.location.city}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="cart-location-change">
                    Need a different location? Visit the menu and select items from another store to switch.
                  </p>
                </div>
              )}

              {/* Cart Items */}
              <div className="cart-items">
                {cart.items.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-content">
                      <div className="cart-item-header">
                        <h3 className="cart-item-name">{item.menuItem.name}</h3>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="cart-item-remove"
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Modifiers */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <ul className="cart-item-modifiers">
                          {item.modifiers.map((mod, modIndex) => (
                            <li key={modIndex} className="cart-item-modifier">
                              {mod.name}: {mod.option}
                              {mod.priceDelta !== 0 && (
                                <span className="cart-item-modifier-price">
                                  {mod.priceDelta > 0 ? '+' : ''}${mod.priceDelta.toFixed(2)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <p className="cart-item-instructions">
                          Note: {item.specialInstructions}
                        </p>
                      )}

                      {/* Quantity and Price */}
                      <div className="cart-item-footer">
                        <div className="cart-item-quantity">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="cart-item-quantity-btn"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="cart-item-quantity-value">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="cart-item-quantity-btn"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="cart-item-price">
                          ${((item.price + (item.modifiers ?? []).reduce((sum, mod) => sum + mod.priceDelta, 0)) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="cart-totals">
                <div className="cart-total-row">
                  <span>Subtotal</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-total-row">
                  <span>Tax</span>
                  <span>${cart.tax.toFixed(2)}</span>
                </div>
                {cart.tip > 0 && (
                  <div className="cart-total-row">
                    <span>Tip</span>
                    <span>${cart.tip.toFixed(2)}</span>
                  </div>
                )}
                {cart.deliveryFee > 0 && (
                  <div className="cart-total-row">
                    <span>Delivery Fee</span>
                    <span>${cart.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-total-row cart-total-final">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="cart-drawer-footer">
                <Link href="/checkout" className="cart-checkout-btn" onClick={onClose}>
                  Proceed to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

// Floating Cart Button (shows item count)
export function CartButton() {
  const { itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cart-floating-button"
        aria-label="Open cart"
      >
        <ShoppingCart size={24} />
        {itemCount > 0 && <span className="cart-floating-badge">{itemCount}</span>}
      </button>

      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
