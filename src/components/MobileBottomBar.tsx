'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingCart, Package, User, Shield, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function MobileBottomBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { role, openAuthModal, isLoggedIn, userName } = useAuth();

  // If inside admin dashboard routes, do not render client bottom bar
  // (Admin has its own dedicated mobile header and drawer)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/vendor');

  if (isAdminRoute) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      href: '/',
      label: 'Inicio',
      icon: Home,
      exact: true,
    },
    {
      id: 'catalog',
      href: '/#catalogo',
      label: 'Arsenal',
      icon: Compass,
      exact: false,
    },
    {
      id: 'cart',
      href: '/carrito',
      label: 'Carrito',
      icon: ShoppingCart,
      badge: totalItems,
      exact: false,
    },
    {
      id: 'orders',
      href: '/ordenes',
      label: 'Órdenes',
      icon: Package,
      exact: false,
    },
  ];

  const isCurrentActive = (href: string, exact: boolean) => {
    if (exact) return pathname === '/';
    return pathname.startsWith(href.split('#')[0]) && href.split('#')[0] !== '/';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
      {/* Background blur container with top border and safe-area padding */}
      <nav
        aria-label="Navegación móvil inferior"
        className="bg-[#070709]/95 backdrop-blur-2xl border-t border-[#C8A961]/20 shadow-[0_-4px_30px_rgba(0,0,0,0.8)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.href, item.exact);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px] min-h-[46px] touch-manipulation ${
                  active
                    ? 'text-[#C8A961] bg-[#C8A961]/10 font-bold'
                    : 'text-[#A1A1AA] hover:text-white active:scale-95'
                }`}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -top-1 w-5 h-1 bg-[#C8A961] rounded-full shadow-[0_0_8px_#C8A961]" />
                )}

                <div className="relative">
                  <Icon size={20} className={active ? 'scale-110 text-[#C8A961]' : ''} />

                  {/* Cart item count badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-[#C8A961] text-[#050507] rounded-full text-[10px] font-black font-mono flex items-center justify-center shadow-[0_0_12px_rgba(200,169,97,0.7)] animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Profile / Admin action */}
          {role === 'admin' ? (
            <Link
              href="/admin/overview"
              className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px] min-h-[46px] text-[#C8A961] bg-[#C8A961]/10 border border-[#C8A961]/30 active:scale-95 touch-manipulation"
              title="Panel de Administración"
            >
              <Shield size={20} className="text-[#C8A961]" />
              <span className="text-[10px] tracking-tight mt-1 font-mono font-bold uppercase text-[#C8A961]">
                Admin
              </span>
            </Link>
          ) : (
            <button
              onClick={openAuthModal}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px] min-h-[46px] active:scale-95 touch-manipulation ${
                isLoggedIn
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title={isLoggedIn ? `Sesión de ${userName}` : 'Iniciar sesión'}
            >
              <User size={20} />
              <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">
                {isLoggedIn ? 'Perfil' : 'Ingresar'}
              </span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
