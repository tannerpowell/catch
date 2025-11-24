'use client';

import { OrderCard } from './OrderCard';
import type { Order } from '@/lib/types';

interface OrderColumnProps {
  title: string;
  status: string;
  orders: Order[];
  nextStatus: string;
  actionLabel: string;
  actionColor: 'blue' | 'green' | 'gray';
  onOrderUpdate: (orderId: string, newStatus: string) => void;
}

/**
 * Renders a kitchen column with a header (title and order count) and content that shows either an empty state or a list of orders.
 *
 * @param title - Column title displayed in the header
 * @param status - Current status represented by this column (informational)
 * @param orders - Array of orders to display in the column
 * @param nextStatus - Status value to apply when an order is advanced via the column's action
 * @param actionLabel - Text label shown on each OrderCard's action control
 * @param actionColor - Color variant for the action control: 'blue', 'green', or 'gray'
 * @param onOrderUpdate - Callback invoked as onOrderUpdate(orderId, newStatus) when an order requests a status change
 * @returns A React element representing the column; shows an empty-state UI when `orders` is empty, otherwise a list of OrderCard components.
 */
export function OrderColumn({
  title,
  status,
  orders,
  nextStatus,
  actionLabel,
  actionColor,
  onOrderUpdate,
}: OrderColumnProps) {
  return (
    <div className="kitchen-column">
      {/* Column header - iPad optimized */}
      <div className="kitchen-column-header">
        <h2>{title}</h2>
        <span className="kitchen-column-count">{orders.length}</span>
      </div>

      {/* Order list */}
      <div className="kitchen-column-content">
        {orders.length === 0 ? (
          <div className="kitchen-empty-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              className="kitchen-empty-icon"
            >
              <circle
                cx="32"
                cy="32"
                r="30"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M32 20V32M32 32V44M32 32H44M32 32H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>
            <p>No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              nextStatus={nextStatus}
              actionLabel={actionLabel}
              actionColor={actionColor}
              onUpdate={onOrderUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}