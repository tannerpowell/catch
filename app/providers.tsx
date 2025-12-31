'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { CartProvider } from '@/lib/contexts/CartContext';
import { OrdersProvider } from '@/lib/contexts/OrdersContext';
import { ImageModeProvider } from '@/lib/contexts/ImageModeContext';

// Check if Clerk is configured
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
 * Wraps the given children with Clerk auth (if configured), theme, orders, and cart context providers.
 *
 * @param children - React nodes to render inside the provider hierarchy
 * @returns A React element that provides auth, theme, orders, and cart context to `children`
 */
export function Providers({ children }: { children: ReactNode }) {
  const content = (
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

  // Only wrap with ClerkProvider if keys are configured
  if (isClerkConfigured) {
    return (
      <ClerkProvider appearance={clerkAppearance}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}