'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { CartProvider } from '@/lib/contexts/CartContext';
import { OrdersProvider } from '@/lib/contexts/OrdersContext';

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
