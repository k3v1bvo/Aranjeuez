'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { useCart, useSession } from './Providers';
import { NavbarPaseo } from './NavbarPaseo';
import { FooterPaseo } from './FooterPaseo';
import { QrPulsanteModal } from './QrPulsanteModal';
import { AuthModal } from './AuthModal';
import { CartDrawerModal } from './CartDrawerModal';
import { OrdersTrackerModal } from './OrdersTrackerModal';
import { MOCK_USER } from '@/lib/mock-data';
import { ToastProvider } from './PaseoToast';

export function Shell({ children, demo }: { children: React.ReactNode; demo: boolean }) {
  const { user, logout } = useSession();
  const cart = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // If on root home page '/', PaseoModernidadLanding handles its own full-bleed layout
  if (pathname === '/') return <main id="main">{children}</main>;

  // If on admin or comercio panel, render dashboard layout with luxury glassmorphism
  if (pathname.startsWith('/admin') || pathname.startsWith('/comercio')) {
    const role = pathname.startsWith('/admin') ? 'admin' : 'comercio';
    return (
      <div className="min-h-screen bg-[#030B1A] text-white flex flex-col font-sans selection:bg-[#FF6B1A] selection:text-white">
        <NavbarPaseo
          activeTab="inicio"
          onSelectTab={(tab) => {
            if (tab === 'inicio') router.push('/');
            else if (tab === 'paseoya') router.push('/cliente');
            else if (tab === 'jarvis') router.push('/jarvis');
            else if (tab === 'puntos') router.push('/cliente/puntos');
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenOrders={() => setIsOrdersOpen(true)}
          cartCount={cart.count}
          user={
            user
              ? {
                  name: user.name,
                  points: user.points || 0,
                  level: (user.points || 0) >= 1000 ? 'Platino' : (user.points || 0) >= 500 ? 'Oro' : (user.points || 0) >= 200 ? 'Plata' : 'Bronce',
                }
              : undefined
          }
        />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
          <PanelNav role={role} />
          <main className="flex-1 rounded-3xl glass-andino border border-white/10 p-6 md:p-8 shadow-2xl" id="main">
            {children}
          </main>
        </div>
        <FooterPaseo />
      </div>
    );
  }

  // Active tab determination based on pathname
  let activeTab = 'inicio';
  if (pathname.startsWith('/cliente/puntos')) activeTab = 'puntos';
  else if (pathname.startsWith('/cliente') || pathname.startsWith('/producto')) activeTab = 'paseoya';
  else if (pathname.startsWith('/jarvis')) activeTab = 'jarvis';

  const currentUserData = user
    ? {
        name: user.name,
        points: user.points || 0,
        level: ((user.points || 0) >= 1000
          ? 'Platino'
          : (user.points || 0) >= 500
          ? 'Oro'
          : (user.points || 0) >= 200
          ? 'Plata'
          : 'Bronce') as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
      }
    : {
        name: MOCK_USER.name,
        points: MOCK_USER.points,
        level: MOCK_USER.level as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
      };

  const handleSelectTab = (tab: string) => {
    if (tab === 'inicio') router.push('/');
    else if (tab === 'paseoya') router.push('/cliente');
    else if (tab === 'jarvis') router.push('/jarvis');
    else if (tab === 'puntos') router.push('/cliente/puntos');
    else if (tab === 'espacios') router.push('/#espacios');
    else if (tab === 'mapa') router.push('/#mapa');
  };

  return (
    <ToastProvider>
    <div
      className={`min-h-screen ${
        isDarkMode ? 'bg-[#030B1A] text-white' : 'bg-[#F8F9FB] text-[#061734]'
      } flex flex-col font-sans selection:bg-[#FF6B1A] selection:text-white transition-colors duration-300`}
    >
      {/* Luxury Navbar matching the home page */}
      <NavbarPaseo
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        cartCount={cart.count}
        user={currentUserData}
      />

      {/* Main page content wrapped in luxury dark container */}
      <main className="flex-1 w-full" id="main">
        {children}
      </main>

      {/* Luxury Footer with Chakana and official Paseo branding */}
      <FooterPaseo />

      {/* QR Credential Modal */}
      <QrPulsanteModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        userName={currentUserData.name}
        points={currentUserData.points}
        level={currentUserData.level}
        pinCode={MOCK_USER.pinCode}
        qrToken={MOCK_USER.qrToken}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart.items.map((it) => ({
          id: it.product.id,
          name: it.product.name,
          storeName: it.product.store?.name || 'Tienda Paseo',
          storeLocation: `${it.product.store?.floor || 'Mall'} · ${it.product.store?.local_num || ''}`,
          price: it.product.price,
          quantity: it.quantity,
          imageUrl: it.product.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        }))}
        onUpdateQuantity={(id, delta) => {
          const item = cart.items.find((i) => i.product.id === id);
          if (item) {
            cart.quantity(id, item.quantity + delta);
          }
        }}
        onRemoveItem={(id) => {
          cart.remove(id);
        }}
        onClearCart={() => cart.clear()}
        onOpenOrderTracker={() => {
          setIsCartOpen(false);
          setIsOrdersOpen(true);
        }}
      />

      {/* Orders Tracker Modal */}
      <OrdersTrackerModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </div>
    </ToastProvider>
  );
}

export function PanelNav({ role }: { role: 'admin' | 'comercio' }) {
  const pathname = usePathname();
  const admin = [
    ['overview', 'Resumen'],
    ['sales', 'Pedidos'],
    ['stores', 'Establecimientos'],
    ['products', 'Productos'],
    ['users', 'Usuarios'],
    ['rewards', 'Recompensas'],
    ['promotions', 'Promociones'],
    ['events', 'Eventos'],
    ['categories', 'Categorías'],
    ['analytics', 'Estadísticas'],
    ['audit', 'Movimientos y auditoría'],
    ['alerts', 'Alertas'],
    ['settings', 'Configuración'],
  ];
  const commerce = [
    ['', 'Resumen y pedidos'],
    ['productos', 'Mis productos'],
    ['scanner', 'Caja y validación'],
    ['promociones', 'Promociones'],
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="rounded-3xl glass-andino border border-white/10 p-5 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#B84D0B] to-[#FF6B1A] flex items-center justify-center text-white shadow-lg shadow-[#FF6B1A]/20">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <strong className="block text-sm font-bold text-white font-display">
              {role === 'admin' ? 'Administración' : 'Mi Comercio'}
            </strong>
            <small className="text-xs text-white/50">Paseo Aranjuez</small>
          </div>
        </div>
        <nav className="space-y-1.5" aria-label={`Panel ${role}`}>
          {(role === 'admin' ? admin : commerce).map(([route, label]) => {
            const href = `/${role}${route ? '/' + route : ''}`;
            const isActive = pathname === href;
            return (
              <Link
                href={href}
                key={href}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
