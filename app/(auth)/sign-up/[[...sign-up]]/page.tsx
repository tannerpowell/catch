'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { SignUp } from '@clerk/nextjs';

// Check if Clerk is available (NEXT_PUBLIC_ vars are inlined at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  // If Clerk is not configured, show a fallback message
  if (!isClerkConfigured) {
    return <SignUpFallback />;
  }

  return <ClerkSignUp />;
}

/**
 * Fallback UI when Clerk is not configured.
 * Shows a message and redirects to home.
 */
function SignUpFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] py-12 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-3xl text-[var(--color-text-primary)] mb-4">
          Sign Up Unavailable
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Account creation is not configured for this environment.
        </p>
        <Link
          href={"/" as Route}
          className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

/**
 * Clerk SignUp component wrapper.
 * Only rendered when Clerk is configured.
 */
function ClerkSignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)] mb-2">
            Create Account
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Join The Catch to track orders and earn rewards
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-soft-card border border-[var(--color-border-subtle)]',
            },
          }}
          fallbackRedirectUrl="/account"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
