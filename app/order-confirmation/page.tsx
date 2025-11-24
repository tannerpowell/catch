'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Order confirmation page content component that reads search params.
 * Separated to allow Suspense boundary wrapping (required by Next.js 15+).
 */
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber');

  // Validate orderNumber - log if missing for debugging
  const orderNumber = orderNumberParam?.trim();
  
  if (!orderNumber) {
    console.warn('[OrderConfirmation] Missing or invalid orderNumber parameter', {
      received: orderNumberParam,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
        <h1 className="h2" style={{ marginBottom: '16px' }}>Order Confirmed!</h1>
        
        {!orderNumber && (
          <div
            className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 mb-6 text-sm text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
            role="alert"
          >
            <p style={{ marginBottom: '8px' }}>
              ⚠️ <strong>Order confirmation details could not be retrieved.</strong>
            </p>
            <p style={{ marginBottom: '8px' }}>
              If you completed checkout and received a confirmation screen, please check your email for the order number or contact support.
            </p>
            <p style={{ fontSize: '0.9em', opacity: 0.9 }}>
              If you did not complete checkout, your order may not have been placed. Try placing the order again.
            </p>
          </div>
        )}

        {orderNumber && (
          <p style={{ fontSize: '18px', marginBottom: '8px', color: '#666' }} className="dark:text-neutral-400">
            Order Number: <strong>{orderNumber}</strong>
          </p>
        )}
        <p style={{ fontSize: '16px', marginBottom: '32px', color: '#666' }} className="dark:text-neutral-400">
          Your order has been placed and the kitchen has been notified.
        </p>

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '32px',
        }}
        className="dark:bg-neutral-800">
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }} className="dark:text-neutral-400">
            💡 <strong>Demo Mode:</strong> This is a demonstration order. No payment was processed.
          </p>
          <p style={{ fontSize: '14px', color: '#666' }} className="dark:text-neutral-400">
            Check the <Link href="/kitchen" style={{ color: '#C41E3A', textDecoration: 'underline' }}>Kitchen Dashboard</Link> to see your order appear in real-time!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/menu" className="button">
            Order More
          </Link>
          <Link href="/kitchen" className="button" style={{ backgroundColor: '#C41E3A', color: 'white' }}>
            View Kitchen Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Order confirmation page that displays the placed order status, demo notice, and navigation actions.
 *
 * Reads the `orderNumber` from URL search parameters and logs a diagnostic warning if it is missing or empty.
 * When an order number is present the page shows it; otherwise it shows a warning alert with guidance.
 * The page also includes a demo-mode disclaimer, a link to the Kitchen Dashboard, and buttons to continue ordering or view the dashboard.
 *
 * @returns The rendered confirmation page as a JSX element.
 */
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}