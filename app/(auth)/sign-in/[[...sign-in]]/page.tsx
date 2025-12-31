import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)] mb-2">
            Welcome Back
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Sign in to track your orders and view order history
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-soft-card border border-[var(--color-border-subtle)]',
            },
          }}
          fallbackRedirectUrl="/account"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
