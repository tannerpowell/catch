'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--color--crema-fresca)',
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-family--headings)',
          fontSize: '48px',
          color: 'var(--color--tierra-reca)',
          marginBottom: '16px',
        }}>
          Something went wrong
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(50, 39, 35, 0.7)',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          We encountered an unexpected error. This has been logged and we'll look into it.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '14px 32px',
              backgroundColor: 'var(--color--ocean-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#246b8a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color--ocean-blue)';
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '14px 32px',
              backgroundColor: 'transparent',
              color: 'var(--color--tierra-reca)',
              border: '1.5px solid var(--color--tierra-reca)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
