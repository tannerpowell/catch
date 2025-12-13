'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrders } from '@/lib/contexts/OrdersContext';

/**
 * Render the checkout UI, validate contact input, submit a demo order, and navigate to confirmation.
 *
 * Validates name, email format, and a 10-digit US phone number; on successful submission it creates a demo order
 * via the Orders context, clears the cart, and redirects to the order confirmation page. Displays loading and
 * empty-cart states, an error banner for validation/runtime errors, and a sticky order summary reflecting cart contents.
 *
 * @returns The checkout page React element containing the form, order summary, and submission handlers.
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
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\-\(\)]+$/; // US format only: digits, spaces, hyphens, parentheses

  const validateForm = (): boolean => {
    setError(null);

    // Validate name
    if (!customerInfo.name.trim()) {
      setError('Name is required');
      return false;
    }

    // Validate email
    if (!customerInfo.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate phone
    if (!customerInfo.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(customerInfo.phone)) {
      setError('Phone number contains invalid characters');
      return false;
    }
    // Extract only digits and validate count
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

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Create order
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

      // Clear cart only on success
      clearCart();

      // Redirect to confirmation page
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
      <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>Loading cart...</p>
        </div>
      </div>
    );
  }

  // TypeScript guard: cart is definitely Cart at this point
  const cartData = cart;

  if (cartData.items.length === 0) {
    return (
      <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="h2">Your cart is empty</h1>
          <p style={{ marginTop: '16px', marginBottom: '24px' }}>Add some items from the menu to get started.</p>
          <a href="/menu" className="button">View Menu</a>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 className="h2" style={{ marginBottom: '40px' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Left: Form */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Error Banner */}
              {error && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#fee',
                  border: '1px solid #dc3545',
                  borderRadius: '8px',
                  color: '#721c24',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                className="dark:bg-red-950 dark:border-red-800 dark:text-red-200"
                >
                  {error}
                </div>
              )}

              {/* Customer Info */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Contact Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                      }}
                      className="dark:bg-neutral-800 dark:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                      }}
                      className="dark:bg-neutral-800 dark:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="(214) 555-0123"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                      }}
                      className="dark:bg-neutral-800 dark:border-neutral-700"
                    />
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Order Type</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: orderType === 'pickup' ? '2px solid #C41E3A' : '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: orderType === 'pickup' ? '#fee' : 'transparent',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    className="dark:border-neutral-700"
                  >
                    🏪 Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: orderType === 'delivery' ? '2px solid #C41E3A' : '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: orderType === 'delivery' ? '#fee' : 'transparent',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    className="dark:border-neutral-700"
                  >
                    🚗 Delivery
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div style={{ marginBottom: '32px' }}>
                <label htmlFor="instructions" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Special Instructions (optional)
                </label>
                <textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  placeholder="Any special requests for your order?"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                  }}
                  className="dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmitting ? '#999' : '#C41E3A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Processing...' : 'Place Order (Demo)'}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '24px',
              position: 'sticky',
              top: '100px',
            }}
            className="dark:border-neutral-700"
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Order Summary</h2>

              {/* Location */}
              {cartData.location && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}
                className="dark:bg-neutral-800">
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Ordering from:</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{cartData.location.name}</div>
                </div>
              )}

              {/* Items */}
              <div style={{ marginBottom: '16px' }}>
                {cartData.items.map((item, index) => (
                  <div key={index} style={{ paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #eee' }}
                  className="dark:border-neutral-700">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{item.quantity}x {item.menuItem.name}</span>
                      <span>${((item.price + item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.modifiers.length > 0 && (
                      <div style={{ fontSize: '14px', color: '#666', marginLeft: '20px' }}
                      className="dark:text-neutral-400">
                        {item.modifiers.map((mod, i) => (
                          <div key={i}>{mod.name}: {mod.option}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '2px solid #ddd', paddingTop: '16px' }}
              className="dark:border-neutral-700">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Subtotal</span>
                  <span>${cartData.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Tax</span>
                  <span>${cartData.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}
                className="dark:border-neutral-700">
                  <span>Total</span>
                  <span>${cartData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
