'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrders } from '@/lib/contexts/OrdersContext';
import { formatPrice } from '@/lib/utils';

/**
 * Checkout page with Catch design system styling.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, isHydrated } = useCart();
  const { addOrder } = useOrders();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\-\(\)]+$/;

  const validateForm = (): boolean => {
    setError(null);

    if (!customerInfo.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!customerInfo.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!customerInfo.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(customerInfo.phone)) {
      setError('Phone number contains invalid characters');
      return false;
    }
    const digitsOnly = customerInfo.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit US phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      try {
        addOrder({
          orderNumber,
          status: 'confirmed',
          location: {
            _ref: cartData.location?._id || '',
            _type: 'reference',
          },
          locationSnapshot: {
            name: cartData.location?.name || '',
            address: cartData.location?.addressLine1 || '',
            phone: cartData.location?.phone || '',
          },
          customer: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            smsOptIn,
            marketingOptIn: false,
          },
          orderType,
          items: cartData.items.map(item => ({
            menuItem: { _ref: item.menuItem.id, _type: 'reference' },
            menuItemSnapshot: {
              name: item.menuItem.name,
              description: item.menuItem.description,
              basePrice: item.price,
            },
            quantity: item.quantity,
            price: item.price,
            totalPrice: (item.price + item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) * item.quantity,
            modifiers: item.modifiers,
            specialInstructions: item.specialInstructions,
          })),
          subtotal: cartData.subtotal,
          tax: cartData.tax,
          taxRate: cartData.location?.taxRate || 0.0825,
          tip: cartData.tip,
          deliveryFee: cartData.deliveryFee,
          platformFee: 0,
          total: cartData.total,
          locationPayout: cartData.total,
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          revelSynced: false,
          specialInstructions,
        });
      } catch {
        throw new Error('Failed to create order. Please try again.');
      }

      clearCart();
      await router.push(`/order-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated || !cart) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <p>Loading cart...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const cartData = cart;

  if (cartData.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add some items from the menu to get started.</p>
          <a href="/menu" className="checkout-btn checkout-btn--primary">View Menu</a>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          {/* Left: Form */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit}>
              {/* Error Banner */}
              {error && (
                <div className="checkout-error">
                  {error}
                </div>
              )}

              {/* Customer Info */}
              <div className="checkout-section">
                <h2 className="checkout-section-title">Contact Information</h2>
                <div className="checkout-fields">
                  <div className="checkout-field">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="checkout-input"
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="checkout-input"
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="(214) 555-0123"
                      className="checkout-input"
                    />
                  </div>
                  <label className="checkout-checkbox-label">
                    <input
                      type="checkbox"
                      checked={smsOptIn}
                      onChange={(e) => setSmsOptIn(e.target.checked)}
                      className="checkout-checkbox"
                    />
                    <span>Text me order updates (recommended)</span>
                  </label>
                </div>
              </div>

              {/* Order Type - Track Pattern */}
              <div className="checkout-section">
                <h2 className="checkout-section-title">Order Type</h2>
                <div className="checkout-order-type">
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`checkout-order-type-btn ${orderType === 'pickup' ? 'active' : ''}`}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`checkout-order-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="checkout-section">
                <label htmlFor="instructions" className="checkout-label">
                  Special Instructions (optional)
                </label>
                <textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                  placeholder="Any special requests for your order?"
                  className="checkout-input checkout-textarea"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`checkout-btn checkout-btn--primary checkout-btn--full ${isSubmitting ? 'disabled' : ''}`}
              >
                {isSubmitting ? 'Processing...' : 'Place Order (Demo)'}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary-section">
            <div className="checkout-summary">
              <h2 className="checkout-section-title">Order Summary</h2>

              {/* Location */}
              {cartData.location && (
                <div className="checkout-location">
                  <span className="checkout-location-label">Ordering from:</span>
                  <span className="checkout-location-name">{cartData.location.name}</span>
                </div>
              )}

              {/* Items */}
              <div className="checkout-items">
                {cartData.items.map((item, index) => (
                  <div key={index} className="checkout-item">
                    <div className="checkout-item-row">
                      <span className="checkout-item-name">{item.quantity}x {item.menuItem.name}</span>
                      <span className="checkout-item-price">
                        {formatPrice((item.price + item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * item.quantity)}
                      </span>
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="checkout-item-mods">
                        {item.modifiers.map((mod, i) => (
                          <div key={i}>{mod.name}: {mod.option}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="checkout-totals">
                <div className="checkout-totals-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartData.subtotal)}</span>
                </div>
                <div className="checkout-totals-row">
                  <span>Tax</span>
                  <span>{formatPrice(cartData.tax)}</span>
                </div>
                <div className="checkout-totals-row checkout-totals-total">
                  <span>Total</span>
                  <span>{formatPrice(cartData.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .checkout-page {
    min-height: 100vh;
    background: var(--color--crema-fresca, #FDF8ED);
    padding: 80px 24px;
  }

  .checkout-loading,
  .checkout-empty {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .checkout-empty h1 {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 32px;
    color: var(--color--tierra-reca, #322723);
    margin-bottom: 12px;
  }

  .checkout-empty p {
    color: var(--color-text-muted, #7c6a63);
    margin-bottom: 24px;
  }

  .checkout-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .checkout-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 36px;
    font-weight: 500;
    color: var(--color--tierra-reca, #322723);
    margin-bottom: 40px;
  }

  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }

  @media (max-width: 768px) {
    .checkout-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Error */
  .checkout-error {
    margin-bottom: 24px;
    padding: 14px 18px;
    background: rgba(180, 60, 60, 0.08);
    border: 1px solid rgba(180, 60, 60, 0.2);
    border-radius: 10px;
    color: #8b3a3a;
    font-size: 14px;
    font-weight: 500;
  }

  /* Sections */
  .checkout-section {
    margin-bottom: 32px;
  }

  .checkout-section-title {
    font-family: var(--font-family--headings, 'Poppins', sans-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--color--tierra-reca, #322723);
    margin-bottom: 16px;
  }

  /* Fields */
  .checkout-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .checkout-field label,
  .checkout-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 14px;
    color: var(--color--tierra-reca, #322723);
  }

  .checkout-input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(50, 39, 35, 0.02);
    border: 1px solid rgba(50, 39, 35, 0.08);
    border-radius: 10px;
    font-size: 15px;
    color: var(--color--tierra-reca, #322723);
    box-shadow: inset 0 1px 2px rgba(50, 39, 35, 0.03);
    transition: all 0.25s ease;
  }

  .checkout-input::placeholder {
    color: var(--color-text-muted, #7c6a63);
  }

  .checkout-input:focus {
    outline: none;
    border-color: var(--color--ocean-blue, #2B7A9B);
    background: white;
    box-shadow: 0 0 0 3px rgba(43, 122, 155, 0.1);
  }

  .checkout-textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Checkbox */
  .checkout-checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    color: var(--color--tierra-reca, #322723);
  }

  .checkout-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--color--ocean-blue, #2B7A9B);
    cursor: pointer;
  }

  /* Order Type - Track Pattern */
  .checkout-order-type {
    display: flex;
    gap: 8px;
    padding: 6px;
    background: rgba(50, 39, 35, 0.04);
    border-radius: 12px;
    border: 1px solid rgba(50, 39, 35, 0.06);
  }

  .checkout-order-type-btn {
    flex: 1;
    padding: 14px 20px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-family: var(--font-family--headings, 'Poppins', sans-serif);
    font-size: 15px;
    font-weight: 500;
    color: var(--color--tierra-reca, #322723);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .checkout-order-type-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.6);
  }

  .checkout-order-type-btn.active {
    background: var(--color--ocean-blue, #2B7A9B);
    color: white;
    box-shadow: 0 3px 10px rgba(43, 122, 155, 0.2);
  }

  /* Buttons */
  .checkout-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 28px;
    border: none;
    border-radius: 10px;
    font-family: var(--font-family--headings, 'Poppins', sans-serif);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
  }

  .checkout-btn--primary {
    background: var(--color--ocean-blue, #2B7A9B);
    color: white;
  }

  .checkout-btn--primary:hover {
    background: #246a87;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(43, 122, 155, 0.25);
  }

  .checkout-btn--full {
    width: 100%;
    padding: 16px;
    font-size: 17px;
  }

  .checkout-btn.disabled {
    background: var(--color-text-muted, #7c6a63);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Summary */
  .checkout-summary {
    background: white;
    border: 1px solid rgba(50, 39, 35, 0.08);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(50, 39, 35, 0.04);
    position: sticky;
    top: 100px;
  }

  .checkout-location {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    background: rgba(50, 39, 35, 0.03);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .checkout-location-label {
    font-size: 13px;
    color: var(--color-text-muted, #7c6a63);
  }

  .checkout-location-name {
    font-weight: 600;
    color: var(--color--tierra-reca, #322723);
  }

  /* Items */
  .checkout-items {
    margin-bottom: 20px;
  }

  .checkout-item {
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid rgba(50, 39, 35, 0.06);
  }

  .checkout-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .checkout-item-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .checkout-item-name {
    font-weight: 500;
    color: var(--color--tierra-reca, #322723);
  }

  .checkout-item-price {
    font-weight: 500;
    color: var(--color--tierra-reca, #322723);
    white-space: nowrap;
  }

  .checkout-item-mods {
    font-size: 13px;
    color: var(--color-text-muted, #7c6a63);
    margin-top: 6px;
    margin-left: 20px;
  }

  /* Totals */
  .checkout-totals {
    border-top: 1px solid rgba(50, 39, 35, 0.1);
    padding-top: 16px;
  }

  .checkout-totals-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    color: var(--color-text-secondary, #5b4a42);
  }

  .checkout-totals-total {
    font-weight: 600;
    font-size: 18px;
    color: var(--color--tierra-reca, #322723);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(50, 39, 35, 0.1);
  }

  /* Dark mode */
  :global(.dark) .checkout-page {
    background: #0f1720;
  }

  :global(.dark) .checkout-title,
  :global(.dark) .checkout-section-title,
  :global(.dark) .checkout-field label,
  :global(.dark) .checkout-label,
  :global(.dark) .checkout-item-name,
  :global(.dark) .checkout-item-price,
  :global(.dark) .checkout-location-name,
  :global(.dark) .checkout-totals-total {
    color: #f0f0f0;
  }

  :global(.dark) .checkout-input {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
    color: #f0f0f0;
  }

  :global(.dark) .checkout-input:focus {
    background: rgba(255, 255, 255, 0.05);
    border-color: #4a9aba;
    box-shadow: 0 0 0 3px rgba(74, 154, 186, 0.15);
  }

  :global(.dark) .checkout-order-type {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  :global(.dark) .checkout-order-type-btn {
    color: #f0f0f0;
  }

  :global(.dark) .checkout-order-type-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.06);
  }

  :global(.dark) .checkout-summary {
    background: #1a2332;
    border-color: rgba(255, 255, 255, 0.06);
  }

  :global(.dark) .checkout-location {
    background: rgba(255, 255, 255, 0.03);
  }

  :global(.dark) .checkout-item {
    border-color: rgba(255, 255, 255, 0.06);
  }

  :global(.dark) .checkout-totals {
    border-color: rgba(255, 255, 255, 0.08);
  }

  :global(.dark) .checkout-totals-total {
    border-color: rgba(255, 255, 255, 0.08);
  }

  :global(.dark) .checkout-totals-row {
    color: #b8c4d0;
  }

  :global(.dark) .checkout-error {
    background: rgba(180, 60, 60, 0.15);
    border-color: rgba(180, 60, 60, 0.3);
    color: #f0a0a0;
  }

  :global(.dark) .checkout-checkbox-label {
    color: #f0f0f0;
  }
`;
