'use client';

import { Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
}

/**
 * Render a success modal that informs the user an item was added to the cart.
 *
 * @param isOpen - Controls whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param itemName - The display name of the item shown in the modal message
 * @returns The modal JSX when `isOpen` is true, otherwise `null`
 */
export function SuccessModal({ isOpen, onClose, itemName }: SuccessModalProps) {
  if (!isOpen) return null;

  const handleGoToCart = () => {
    onClose();
    // Find and click the nav cart button to open the drawer
    const cartButton = document.querySelector('.nav-cart-button') as HTMLButtonElement;
    if (cartButton) {
      cartButton.click();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
        <div className="modal-content">
          {/* Success Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          }}>
            <Check size={32} color="white" strokeWidth={3} />
          </div>

          {/* Title */}
          <h2 id="success-modal-title" className="modal-title" style={{ marginBottom: '12px' }}>
            Added to Cart!
          </h2>

          {/* Message */}
          <p className="modal-message" style={{ marginBottom: '32px' }}>
            {itemName} has been added to your cart
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              className="modal-btn modal-btn-secondary"
              style={{ flex: 1 }}
            >
              Keep Browsing
            </button>
            <button
              onClick={handleGoToCart}
              className="modal-btn modal-btn-primary"
              style={{ flex: 1 }}
            >
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
