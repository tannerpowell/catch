'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { CartProvider } from '@/lib/contexts/CartContext';
import { OrdersProvider } from '@/lib/contexts/OrdersContext';

/**
 * Wraps the given children with theme, orders, and cart context providers.
 *
 * @param children - React nodes to render inside the provider hierarchy
 * @returns A React element that provides theme, orders, and cart context to `children`
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <OrdersProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}