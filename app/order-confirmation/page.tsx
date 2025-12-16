'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Order confirmation page content component.
 */
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('orderNumber');
  const orderNumber = orderNumberParam?.trim();

  if (!orderNumber) {
    console.warn('[OrderConfirmation] Missing or invalid orderNumber parameter', {
      received: orderNumberParam,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
            <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.1"/>
            <path d="M22 32L28 38L42 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="confirmation-title">Order Confirmed!</h1>

        {!orderNumber && (
          <div className="confirmation-warning" role="alert">
            <p className="confirmation-warning-title">
              Order confirmation details could not be retrieved.
            </p>
            <p>
              If you completed checkout and received a confirmation screen, please check your email for the order number or contact support.
            </p>
            <p className="confirmation-warning-note">
              If you did not complete checkout, your order may not have been placed. Try placing the order again.
            </p>
          </div>
        )}

        {orderNumber && (
          <p className="confirmation-order-number">
            Order Number: <strong>{orderNumber}</strong>
          </p>
        )}

        <p className="confirmation-subtitle">
          Your order has been placed and the kitchen has been notified.
        </p>

        <div className="confirmation-demo-notice">
          <p className="confirmation-demo-title">
            Demo Mode
          </p>
          <p>
            This is a demonstration order. No payment was processed.
          </p>
          <p>
            Check the{' '}
            <Link href="/kitchen" className="confirmation-link">
              Kitchen Dashboard
            </Link>{' '}
            to see your order appear in real-time!
          </p>
        </div>

        <div className="confirmation-actions">
          <Link href="/menu" className="confirmation-btn confirmation-btn--secondary">
            Order More
          </Link>
          <Link href="/kitchen" className="confirmation-btn confirmation-btn--primary">
            View Kitchen Dashboard
          </Link>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

/**
 * Order confirmation page wrapper with Suspense boundary.
 */
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="confirmation-loading">
            <div className="confirmation-loading-spinner" />
            <p>Loading...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}

const styles = `
  .confirmation-page {
    min-height: 100vh;
    background: var(--color--crema-fresca, #FDF8ED);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
  }

  .confirmation-container {
    text-align: center;
    max-width: 560px;
  }

  .confirmation-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--color-text-muted, #7c6a63);
  }

  .confirmation-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(50, 39, 35, 0.1);
    border-top-color: var(--color--ocean-blue, #2B7A9B);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .confirmation-icon {
    color: var(--color--ocean-blue, #2B7A9B);
    margin-bottom: 24px;
  }

  .confirmation-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 36px;
    font-weight: 500;
    color: var(--color--tierra-reca, #322723);
    margin-bottom: 16px;
  }

  .confirmation-order-number {
    font-size: 17px;
    color: var(--color-text-secondary, #5b4a42);
    margin-bottom: 8px;
  }

  .confirmation-order-number strong {
    color: var(--color--tierra-reca, #322723);
    font-weight: 600;
  }

  .confirmation-subtitle {
    font-size: 16px;
    color: var(--color-text-muted, #7c6a63);
    margin-bottom: 32px;
  }

  .confirmation-warning {
    background: rgba(180, 120, 60, 0.08);
    border: 1px solid rgba(180, 120, 60, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    text-align: left;
  }

  .confirmation-warning-title {
    font-weight: 600;
    color: #8b6030;
    margin-bottom: 12px;
  }

  .confirmation-warning p {
    font-size: 14px;
    color: #8b6030;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .confirmation-warning-note {
    opacity: 0.85;
    font-size: 13px !important;
  }

  .confirmation-demo-notice {
    background: rgba(50, 39, 35, 0.04);
    border: 1px solid rgba(50, 39, 35, 0.08);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 32px;
  }

  .confirmation-demo-title {
    font-family: var(--font-family--headings, 'Poppins', sans-serif);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color--ocean-blue, #2B7A9B);
    margin-bottom: 12px;
  }

  .confirmation-demo-notice p {
    font-size: 14px;
    color: var(--color-text-secondary, #5b4a42);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .confirmation-demo-notice p:last-child {
    margin-bottom: 0;
  }

  .confirmation-link {
    color: var(--color--ocean-blue, #2B7A9B);
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }

  .confirmation-link:hover {
    border-bottom-color: var(--color--ocean-blue, #2B7A9B);
  }

  .confirmation-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .confirmation-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 28px;
    border-radius: 10px;
    font-family: var(--font-family--headings, 'Poppins', sans-serif);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .confirmation-btn--primary {
    background: var(--color--ocean-blue, #2B7A9B);
    color: white;
  }

  .confirmation-btn--primary:hover {
    background: #246a87;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(43, 122, 155, 0.25);
  }

  .confirmation-btn--secondary {
    background: white;
    color: var(--color--tierra-reca, #322723);
    border: 1px solid rgba(50, 39, 35, 0.12);
  }

  .confirmation-btn--secondary:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(50, 39, 35, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(50, 39, 35, 0.08);
  }

  /* Dark mode */
  :global(.dark) .confirmation-page {
    background: #0f1720;
  }

  :global(.dark) .confirmation-title {
    color: #f0f0f0;
  }

  :global(.dark) .confirmation-order-number {
    color: #b8c4d0;
  }

  :global(.dark) .confirmation-order-number strong {
    color: #f0f0f0;
  }

  :global(.dark) .confirmation-subtitle {
    color: #7a8a9a;
  }

  :global(.dark) .confirmation-icon {
    color: #4a9aba;
  }

  :global(.dark) .confirmation-demo-notice {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  :global(.dark) .confirmation-demo-title {
    color: #4a9aba;
  }

  :global(.dark) .confirmation-demo-notice p {
    color: #b8c4d0;
  }

  :global(.dark) .confirmation-link {
    color: #4a9aba;
  }

  :global(.dark) .confirmation-btn--secondary {
    background: #1a2332;
    color: #f0f0f0;
    border-color: rgba(255, 255, 255, 0.08);
  }

  :global(.dark) .confirmation-btn--secondary:hover {
    background: #243040;
    border-color: rgba(255, 255, 255, 0.12);
  }

  :global(.dark) .confirmation-warning {
    background: rgba(180, 120, 60, 0.12);
    border-color: rgba(180, 120, 60, 0.25);
  }

  :global(.dark) .confirmation-warning-title,
  :global(.dark) .confirmation-warning p {
    color: #d4a060;
  }
`;
