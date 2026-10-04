'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Home, ShoppingBag, QrCode, Bot, ShoppingCart } from 'lucide-react';
import { useSession } from './Providers';
import { QrPulsanteModal } from './QrPulsanteModal';
import { levelFor } from '@/lib/paseo/model';
export function MobileBottomDock() {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  if (loading || (user && user.role !== 'cliente')) return null;
  return (
    <>
      <nav className="mobile-bottom-dock" aria-label="Accesos rápidos">
        <Link href="/">
          <Home />
          <span>Inicio</span>
        </Link>
        <Link href="/cliente">
          <ShoppingBag />
          <span>PaseoYa</span>
        </Link>
        {user ? (
          <button onClick={() => setOpen(true)}>
            <QrCode />
            <span>Mi QR</span>
          </button>
        ) : (
          <Link href="/auth/login">
            <QrCode />
            <span>Mi QR</span>
          </Link>
        )}
        <Link href="/jarvis">
          <Bot />
          <span>Jarvis</span>
        </Link>
        <Link href="/carrito">
          <ShoppingCart />
          <span>Carrito</span>
        </Link>
      </nav>
      {user && (
        <QrPulsanteModal
          isOpen={open}
          onClose={() => setOpen(false)}
          userName={user.name}
          points={user.points}
          level={levelFor(user.points).name as 'Bronce' | 'Plata' | 'Oro' | 'Platino'}
          qrToken={user.qr_token}
          pinCode={user.qr_token}
        />
      )}
    </>
  );
}
