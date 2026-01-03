'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { CartProvider } from '@/lib/contexts/CartContext';
import { OrdersProvider } from '@/lib/contexts/OrdersContext';
import { ImageModeProvider } from '@/lib/contexts/ImageModeContext';

// Check at module level - this is evaluated once and is consistent
// because NEXT_PUBLIC_ vars are inlined at build time
const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Clerk theme customization
const clerkAppearance = {
  variables: {
    colorPrimary: '#2B7A9B', // Ocean blue
    colorBackground: '#faf7f3', // Cream background
    colorText: '#241814', // Dark brown text
    colorTextSecondary: '#5b4a42',
    borderRadius: '0.625rem',
  },
  elements: {
    formButtonPrimary: 'bg-[#2B7A9B] hover:bg-[#236b88]',
    card: 'shadow-soft-card',
  },
};

/**
 * Inner providers that don't depend on Clerk configuration
 */
function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ImageModeProvider>
        <OrdersProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </OrdersProvider>
      </ImageModeProvider>
    </ThemeProvider>
  );
}

/**
 * Wraps the given children with Clerk auth (if configured), theme, orders, and cart context providers.
 * Uses build-time constant for Clerk check to ensure SSR/CSR consistency.
 *
 * @param children - React nodes to render inside the provider hierarchy
 * @returns A React element that provides auth, theme, orders, and cart context to `children`
 */
export function Providers({ children }: { children: ReactNode }) {
  // CLERK_KEY is a build-time constant, so this branch is consistent
  // between server and client rendering
  if (CLERK_KEY) {
    return (
      <ClerkProvider appearance={clerkAppearance}>
        <CoreProviders>{children}</CoreProviders>
      </ClerkProvider>
    );
  }

  return <CoreProviders>{children}</CoreProviders>;
}