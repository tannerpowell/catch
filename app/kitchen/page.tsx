'use client';

import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { KitchenBoard } from '@/components/kitchen/KitchenBoard';
import { RegisterServiceWorker } from './register-sw';
import { useOrders } from '@/lib/contexts/OrdersContext';

export default function KitchenDashboard() {
  const { orders: allOrders, clearOrders, updateOrderStatus } = useOrders();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Filter to only show active orders (not completed/cancelled)
  const orders = allOrders.filter(order =>
    ['confirmed', 'preparing', 'ready'].includes(order.status)
  );

  // Simulate initial load
  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Auto-refresh timestamp every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  // Add to home screen prompt for iPad
  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) {
      // Show subtle hint after 30 seconds
      const timer = setTimeout(() => {
        console.log('Hint: Add to Home Screen for full-screen experience');
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (loading) {
    return (
      <div className="kitchen-loading">
        <div className="spinner" />
        <p>Loading kitchen dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <RegisterServiceWorker />
      <div className="kitchen-dashboard">
        {/* Header - iPad optimized */}
        <header className="kitchen-header">
        <div className="kitchen-header-content">
          <h1>Kitchen</h1>
          <div className="kitchen-header-meta">
            <span className="kitchen-order-count">
              {orders.length} active
            </span>
            <span className="kitchen-last-update">
              Updated {lastRefresh.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        <button
          onClick={() => setLastRefresh(new Date())}
          className="kitchen-refresh-btn"
          aria-label="Refresh orders"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C12.0711 2.5 13.9462 3.36919 15.3033 4.75"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M15 2V5H12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </button>
      </header>

      {/* Main board */}
      <KitchenBoard orders={orders} onOrderUpdate={handleOrderUpdate} />

      {/* Clear Orders Button */}
      {orders.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 100,
        }}>
          <button
            onClick={clearOrders}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            aria-label="Clear all orders"
          >
            🗑️ Clear All Demo Orders
          </button>
        </div>
      )}
      </div>
    </>
  );
}
