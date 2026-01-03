'use client';

import { SignIn } from '@clerk/nextjs';
import { AuthFallback, AuthPageLayout } from '@/components/auth';

// Check if Clerk is available (NEXT_PUBLIC_ vars are inlined at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <AuthFallback
        title="Sign In Unavailable"
        message="Authentication is not configured for this environment."
      />
    );
  }

  return (
    <AuthPageLayout
      title="Welcome Back"
      description="Sign in to track your orders and view order history"
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-soft-card border border-(--color-border-subtle)',
          },
        }}
        fallbackRedirectUrl="/account"
        signUpUrl="/sign-up"
      />
    </AuthPageLayout>
  );
}
