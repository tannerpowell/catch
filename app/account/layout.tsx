'use client';

import { useEffect, useState } from 'react';
import { AccountSidebar } from '@/components/account';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Check if Clerk is available
const isClerkConfigured = typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Dynamically import Clerk hooks only when configured
let useAuth: () => { isLoaded: boolean; isSignedIn: boolean | undefined };
let useUser: () => { user: { firstName?: string | null } | null | undefined };

if (isClerkConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require('@clerk/nextjs');
  useAuth = clerk.useAuth;
  useUser = clerk.useUser;
} else {
  useAuth = () => ({ isLoaded: true, isSignedIn: false });
  useUser = () => ({ user: null });
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only use Clerk hooks if configured
  const { isLoaded, isSignedIn } = isClerkConfigured
    ? useAuth()
    : { isLoaded: true, isSignedIn: false };

  const { user } = isClerkConfigured ? useUser() : { user: null };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in?redirect_url=/account';
    }
  }, [isLoaded, isSignedIn]);

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
