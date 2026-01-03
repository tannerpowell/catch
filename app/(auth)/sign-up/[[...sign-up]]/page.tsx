'use client';

import { SignUp } from '@clerk/nextjs';
import { AuthFallback, AuthPageLayout } from '@/components/auth';

// Check if Clerk is available (NEXT_PUBLIC_ vars are inlined at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <AuthFallback
        title="Sign Up Unavailable"
        message="Account creation is not configured for this environment."
      />
    );
  }

  return (
    <AuthPageLayout
      title="Create Account"
      description="Join The Catch to track orders and earn rewards"
    >
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-soft-card border border-(--color-border-subtle)',
          },
        }}
        fallbackRedirectUrl="/account"
        signInUrl="/sign-in"
      />
    </AuthPageLayout>
  );
}
