'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (and could send to error tracking service)
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          backgroundColor: '#fdf8ed',
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '48px',
              color: '#322723',
              marginBottom: '16px',
              fontWeight: '700',
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'rgba(50, 39, 35, 0.7)',
              marginBottom: '32px',
              lineHeight: '1.6',
            }}>
              We encountered a critical error. Please refresh the page or try again later.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#2B7A9B',
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
                  e.currentTarget.style.backgroundColor = '#2B7A9B';
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '14px 32px',
                  backgroundColor: 'transparent',
                  color: '#322723',
                  border: '1.5px solid #322723',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
