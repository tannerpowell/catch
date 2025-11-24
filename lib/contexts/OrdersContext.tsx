'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@/lib/types';

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, '_id' | '_type'>) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  clearOrders: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'catch-demo-orders';

/**
 * Provides the OrdersContext to its descendants and manages order state with hydration and localStorage persistence.
 *
 * @param children - React nodes that will receive the OrdersContext
 * @returns A React provider element that supplies `orders`, `addOrder`, `updateOrderStatus`, and `clearOrders` to descendants
 */
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load orders from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);

          // Only hydrate if no orders exist in memory (avoid clobbering new orders)
          setOrders((currentOrders) => {
            if (currentOrders.length === 0) {
              return parsed;
            }
            // Keep existing in-memory orders
            return currentOrders;
          });
        }
      } catch (e) {
        console.error('Failed to parse saved orders:', e);
        // Remove corrupted data so we don't repeatedly fail
        localStorage.removeItem(ORDERS_STORAGE_KEY);
      }
      setIsHydrated(true);
    }
  }, []);

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders, isHydrated]);

  const addOrder = (orderData: Omit<Order, '_id' | '_type'>) => {
    const newOrder: Order = {
      ...orderData,
      _id: `demo-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'order',
    };

    setOrders((prev) => [...prev, newOrder]);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id === orderId) {
          const timestampField = `${newStatus}At` as keyof Order;
          return {
            ...order,
            status: newStatus,
            [timestampField]: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const clearOrders = () => {
    setOrders([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ORDERS_STORAGE_KEY);
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        clearOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

/**
 * Retrieves the current Orders context value.
 *
 * @returns The context object with `orders`, `addOrder`, `updateOrderStatus`, and `clearOrders`.
 * @throws If called outside of an `OrdersProvider`.
 */
export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }
  return context;
}