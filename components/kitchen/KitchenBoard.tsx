'use client';

import { OrderColumn } from './OrderColumn';
import type { Order } from '@/lib/types';

interface KitchenBoardProps {
  orders: Order[];
  onOrderUpdate: (orderId: string, newStatus: string) => void;
}

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
