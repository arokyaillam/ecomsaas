'use client';

import { CartProvider } from '@/lib/cart';
import { CustomerAuthProvider } from '@/lib/customer-auth';
import { ToastProvider } from '@/lib/toast';

interface ProvidersProps {
  children: React.ReactNode;
  storeId?: string;
}

export function Providers({ children, storeId }: ProvidersProps) {
  return (
    <ToastProvider>
      <CustomerAuthProvider storeId={storeId || ''}>
        <CartProvider storeId={storeId || ''}>
          {children}
        </CartProvider>
      </CustomerAuthProvider>
    </ToastProvider>
  );
}
