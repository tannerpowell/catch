'use client';

import { OrderCard } from './OrderCard';
import type { Order, OrderStatus } from '@/lib/types';

interface OrderColumnProps {
  title: string;
  orders: Order[];
  nextStatus: OrderStatus;
  actionLabel: string;
  actionColor: 'blue' | 'green' | 'gray';
  onOrderUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrderColumn({
  title,
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
