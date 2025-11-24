'use client';

import { OrderColumn } from './OrderColumn';
import type { Order } from '@/lib/types';

interface KitchenBoardProps {
  orders: Order[];
  onOrderUpdate: (orderId: string, newStatus: string) => void;
}

/**
 * Render a three-column kitchen board that groups orders by status and exposes actions to advance them.
 *
 * @param orders - Array of orders to display in the board; orders are placed into the "New Orders", "Preparing", and "Ready" columns based on their `status` property.
 * @param onOrderUpdate - Callback invoked when a column action requests a status change; called with `orderId` and the desired `newStatus`.
 * @returns The rendered kitchen board element containing three order columns for "confirmed", "preparing", and "ready" orders.
 */
export function KitchenBoard({ orders, onOrderUpdate }: KitchenBoardProps) {
  // Filter orders by status
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="kitchen-board">
      <OrderColumn
        title="New Orders"
        status="confirmed"
        orders={confirmedOrders}
        nextStatus="preparing"
        actionLabel="Start Cooking"
        actionColor="blue"
        onOrderUpdate={onOrderUpdate}
      />

      <OrderColumn
        title="Preparing"
        status="preparing"
        orders={preparingOrders}
        nextStatus="ready"
        actionLabel="Mark Ready"
        actionColor="green"
        onOrderUpdate={onOrderUpdate}
      />

      <OrderColumn
        title="Ready"
        status="ready"
        orders={readyOrders}
        nextStatus="completed"
        actionLabel="Complete"
        actionColor="gray"
        onOrderUpdate={onOrderUpdate}
      />
    </div>
  );
}