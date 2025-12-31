'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { AccountSidebar } from '@/components/account';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Check if Clerk is available (NEXT_PUBLIC_ vars are inlined at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Account layout with authentication.
 * When Clerk is not configured, redirects to sign-in page.
 * Uses Clerk hooks for auth state when ClerkProvider is available.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If Clerk is not configured, we're not inside ClerkProvider,
  // so we can't use Clerk hooks. Redirect to sign-in.
  if (!isClerkConfigured) {
    return <UnauthenticatedLayout />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

/**
 * Fallback layout when Clerk is not configured.
 * Redirects to sign-in page since auth is required.
 */
function UnauthenticatedLayout() {
  const router = useRouter();

  useEffect(() => {
    router.push('/sign-in?redirect_url=/account');
  }, [router]);

  return <AccountLayoutSkeleton />;
}

/**
 * Main authenticated layout with Clerk hooks.
 * Only rendered when Clerk is configured and ClerkProvider wraps the app.
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/account');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while auth is loading
  if (!isLoaded) {
    return <AccountLayoutSkeleton />;
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between border-b p-4">
        <div>
          <p className="font-display font-semibold">My Account</p>
          {user?.firstName && (
            <p className="text-sm text-muted-foreground">
              Welcome, {user.firstName}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-expanded={sidebarOpen}
          aria-controls="mobile-sidebar"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-1px)] sticky top-0">
          <AccountSidebar />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          id="mobile-sidebar"
          role="navigation"
          aria-label="Account navigation"
          aria-hidden={!sidebarOpen}
          className={`
            lg:hidden fixed left-0 top-0 z-50 h-full w-64 bg-background border-r
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <AccountSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AccountLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden lg:block w-64 border-r p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}
