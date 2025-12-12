'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '@/lib/types';
import { KitchenBoard } from '@/components/kitchen/KitchenBoard';
import { RegisterServiceWorker } from './register-sw';
import { useOrders } from '@/lib/contexts/OrdersContext';

/**
 * Render the kitchen dashboard UI for managing active orders.
 *
 * The component displays a header with active order count and a last-updated timestamp, a refresh control,
 * the main KitchenBoard for order interactions, and a floating "Clear All Demo Orders" button when there are active orders.
 * It also updates the last-updated timestamp every 30 seconds and shows a subtle add-to-home-screen hint on non-standalone displays.
 *
 * @returns A React element rendering the kitchen dashboard, including header, refresh control, order board, and optional clear button.
 */
export default function KitchenDashboard() {
  const { orders: allOrders, clearOrders, updateOrderStatus } = useOrders();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [showA2HSHint, setShowA2HSHint] = useState(false);

  // Filter to only show active orders (not completed/cancelled)
  const orders = allOrders.filter(order =>
    ['confirmed', 'preparing', 'ready'].includes(order.status)
  );

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
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

  // Show Add to Home Screen hint for non-standalone users
  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) {
      // Show user-visible hint after 30 seconds
      const timer = setTimeout(() => {
        setShowA2HSHint(true);
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

      {/* Add to Home Screen hint banner */}
      {showA2HSHint && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '500px',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        >
          <span role="img" aria-label="Information">ℹ️</span>
          <span style={{ flex: 1 }}>
            <strong>Tip:</strong> Add this page to your home screen for a full-screen experience
          </span>
          <button
            onClick={() => setShowA2HSHint(false)}
            aria-label="Dismiss hint"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px',
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}

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
