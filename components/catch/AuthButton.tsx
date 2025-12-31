'use client';

import Link from "next/link";
import type { Route } from "next";
import { User } from 'lucide-react';

// Check if Clerk is available
const isClerkConfigured = typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Dynamically import Clerk hooks
let useAuth: () => { isLoaded: boolean; isSignedIn: boolean | undefined };

if (isClerkConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require('@clerk/nextjs');
  useAuth = clerk.useAuth;
} else {
  useAuth = () => ({ isLoaded: true, isSignedIn: false });
}

interface AuthButtonProps {
  className?: string;
  variant?: 'icon' | 'text';
  onNavigate?: () => void;
}

/**
 * Auth-aware button that shows account or sign-in link based on authentication state.
 * Dynamically loads Clerk only when configured.
 */
export function AuthButton({ className = 'nav-account-button', variant = 'icon', onNavigate }: AuthButtonProps) {
  // Always call hooks (they return safe defaults when Clerk is not configured)
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (variant === 'text') {
    return isSignedIn ? (
      <Link
        href="/account"
        className={className}
        onClick={onNavigate}
      >
        my account
      </Link>
    ) : (
      <Link
        href={"/sign-in" as Route}
        className={className}
        onClick={onNavigate}
      >
        sign in
      </Link>
    );
  }

  return isSignedIn ? (
    <Link
      href="/account"
      className={className}
      aria-label="My account"
      onClick={onNavigate}
    >
      <User size={20} />
    </Link>
  ) : (
    <Link
      href={"/sign-in" as Route}
      className={className}
      aria-label="Sign in"
      onClick={onNavigate}
    >
      <User size={20} />
    </Link>
  );
}

export default AuthButton;
