'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Location } from '@/lib/types';

interface LocationSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Location;
  newLocation: Location;
  onConfirm: () => void;
}

export function LocationSwitchModal({
  isOpen,
  onClose,
  currentLocation,
  newLocation,
  onConfirm,
}: LocationSwitchModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
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
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-switch-title"
      >
        <div className="modal-content location-switch-modal">
          {/* Close button */}
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Icon */}
          <div className="modal-icon">
            <AlertCircle size={48} className="location-switch-icon" />
          </div>

          {/* Content */}
          <div className="modal-body">
            <h2 id="location-switch-title" className="modal-title">
              Switch Location?
            </h2>

            <div className="location-switch-message">
              <p className="location-switch-text">
                Your cart contains items from{' '}
                <strong>{currentLocation.name}</strong>.
              </p>
              <p className="location-switch-text">
                Switching to <strong>{newLocation.name}</strong> will clear your
                current cart.
              </p>
              <p className="location-switch-note">
                You can only order from one location at a time.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button onClick={onClose} className="modal-btn modal-btn-secondary">
              Cancel
            </button>
            <button onClick={handleConfirm} className="modal-btn modal-btn-primary">
              Switch to {newLocation.name}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
