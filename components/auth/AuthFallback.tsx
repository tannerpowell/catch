'use client';

import Link from 'next/link';

interface AuthFallbackProps {
  title: string;
  message: string;
}

/**
 * Fallback UI when Clerk authentication is not configured.
 * Shows a message and provides a link back to the home page.
 */
export function AuthFallback({ title, message }: AuthFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] py-12 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-3xl text-[var(--color-text-primary)] mb-4">
          {title}
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          {message}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
