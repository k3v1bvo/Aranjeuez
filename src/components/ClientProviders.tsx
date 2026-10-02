'use client';

import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { PaseoAuthProvider } from '@/context/paseo/AuthContext';
import { Toaster } from 'sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>
        <CartProvider>
          <PaseoAuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#151329',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#F5F5F7',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-sans)',
                },
              }}
              richColors
            />
          </PaseoAuthProvider>
        </CartProvider>
      </AuthProvider>
    </StoreProvider>
  );
}