'use client';

import { useState } from 'react';
import { OrderTimer } from './OrderTimer';
import type { Order, OrderStatus } from '@/lib/types';

interface OrderCardProps {
  order: Order;
  nextStatus: OrderStatus;
  actionLabel: string;
  actionColor: 'blue' | 'green' | 'gray';
  onUpdate: (orderId: string, newStatus: OrderStatus) => void | Promise<void>;
}

export function OrderCard({
  order,
  nextStatus,
  actionLabel,
  actionColor,
  onUpdate,
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      // Update order status via context (await in case it's async)
      await onUpdate(order._id, nextStatus);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format order type badge
  const orderTypeBadge = order.orderType === 'pickup' ? '🥡 Pickup' : '🚗 Delivery';

  // Calculate total item count
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="order-card">
      {/* Card header */}
      <div className="order-card-header">
        <div className="order-card-header-left">
          <span className="order-number">#{order.orderNumber}</span>
          <span className="order-type-badge">{orderTypeBadge}</span>
        </div>
        <OrderTimer createdAt={order.createdAt} />
      </div>

      {/* Customer info */}
      <div className="order-customer">
        <div className="order-customer-name">{order.customer.name}</div>
        {order.customer.phone && (
          <a
            href={`tel:${order.customer.phone}`}
            className="order-customer-phone"
          >
            {order.customer.phone}
          </a>
        )}
      </div>

      {/* Order items */}
      <div className="order-items">
        {order.items.map((item, index) => (
          <div key={item._key ?? `${item.menuItemSnapshot.name}-${item.quantity}-${index}`} className="order-item">
            <div className="order-item-header">
              <span className="order-item-quantity">{item.quantity}x</span>
              <span className="order-item-name">
                {item.menuItemSnapshot.name}
              </span>
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="order-item-modifiers">
                {item.modifiers.map((mod, modIndex) => (
                  <div key={modIndex} className="order-item-modifier">
                    <span className="order-item-modifier-bullet">•</span>
                    <span className="order-item-modifier-text">
                      {mod.name}: {mod.option}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Special instructions */}
            {item.specialInstructions && (
              <div className="order-item-instructions">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="order-item-instructions-icon"
                >
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4V7.5M7 10H7.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{item.specialInstructions}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order-level special instructions */}
      {order.specialInstructions && (
        <div className="order-special-instructions">
          <div className="order-special-instructions-label">Order Notes:</div>
          <div className="order-special-instructions-text">
            {order.specialInstructions}
          </div>
        </div>
      )}

      {/* Card footer with action button */}
      <div className="order-card-footer">
        <div className="order-total">
          <span className="order-total-label">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          <span className="order-total-amount">${order.total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleStatusUpdate}
          disabled={isUpdating}
          className={`order-action-button order-action-button--${actionColor}`}
          aria-label={`${actionLabel} for order ${order.orderNumber}`}
        >
          {isUpdating ? (
            <>
              <span className="order-action-spinner" />
              Updating...
            </>
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </div>
  );
}
