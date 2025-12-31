'use client';

import Link from "next/link";
import type { Route } from "next";
import { User } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// Check if Clerk is available (NEXT_PUBLIC_ vars are inlined at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface AuthButtonProps {
  className?: string;
  variant?: 'icon' | 'text';
  onNavigate?: () => void;
}

/**
 * Auth-aware button that shows account or sign-in link based on authentication state.
 * Uses separate components to avoid conditional hook issues.
 */
export function AuthButton(props: AuthButtonProps) {
  // If Clerk is not configured, always show sign-in button
  if (!isClerkConfigured) {
    return <UnauthenticatedButton {...props} />;
  }

  return <ClerkAuthButton {...props} />;
}

/**
 * Button shown when Clerk is not configured - always shows sign-in.
 */
function UnauthenticatedButton({
  className = 'nav-account-button',
  variant = 'icon',
  onNavigate
}: AuthButtonProps) {
  if (variant === 'text') {
    return (
      <Link
        href={"/sign-in" as Route}
        className={className}
        onClick={onNavigate}
      >
        sign in
      </Link>
    );
  }

  return (
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

/**
 * Clerk-integrated button that uses auth hooks.
 * Only rendered when Clerk is configured and ClerkProvider wraps the app.
 */
function ClerkAuthButton({
  className = 'nav-account-button',
  variant = 'icon',
  onNavigate
}: AuthButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (variant === 'text') {
    return isSignedIn ? (
      <Link
        href={"/account" as Route}
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
      href={"/account" as Route}
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
