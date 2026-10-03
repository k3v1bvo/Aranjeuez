'use client';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, Sparkles, ShoppingBag, Bot, Flame, Compass, Sun, Moon, 
  User, ClipboardList, Layers, LogOut, Menu, X, Store 
} from 'lucide-react';

import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { QrPulsanteModal } from './QrPulsanteModal';
import { MOCK_USER } from '@/lib/mock-data';

interface NavbarPaseoProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenAuth?: () => void;
  onOpenCart?: () => void;
  onOpenOrders?: () => void;
  onLogout?: () => void;
  cartCount?: number;
  user?: {
    name: string;
    points: number;
    level: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
    role?: string;
    qrToken?: string;
  } | null;
}

export function NavbarPaseo({
  activeTab = 'inicio',
  onSelectTab,
  isDarkMode = true,
  onToggleTheme,
  onOpenAuth,
  onOpenCart,
  onOpenOrders,
  onLogout,
  cartCount = 0,
  user = null,
}: NavbarPaseoProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Regla 12: Detección de scroll > 40px para aplicar compresión y blur
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animación de rebote del carrito cuando cambian los items (Regla 18)
  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <>
      {/* Header Sticky con Regla 12 (Nav Scroll: 300ms cubic-bezier(0.4, 0, 0.2, 1)) */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isScrolled
            ? 'backdrop-blur-[20px] bg-[#061734]/80 border-b border-white/10 shadow-lg py-2'
            : 'backdrop-blur-xl bg-[#061734]/95 border-b border-white/10 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Oficial Paseo Aranjuez con Chakana interactiva (Regla 11) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab && onSelectTab('inicio')}
              className="text-left focus:outline-none flex items-center gap-2 group"
            >
              <PaseoAranjuezLogo size="md" showSubtitle={!isScrolled} />
            </button>
          </div>

          {/* Menú Desktop (sin emojis, usando Lucide) */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'inicio'
                  ? 'text-white bg-white/10 shadow-sm border border-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/cliente"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'paseoya'
                  ? 'text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#FF6B1A]" />
              PaseoYa
            </Link>

            <Link
              href="/jarvis"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'jarvis'
                  ? 'text-[#D4A24C] bg-[#D4A24C]/10 border border-[#D4A24C]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-[#D4A24C]" />
              Jarvis
            </Link>

            <Link
              href="/cliente/puntos"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'puntos'
                  ? 'text-[#FF8F4D] bg-[#FF8F4D]/10 border border-[#FF8F4D]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4 text-[#FF8F4D]" />
              Paseo Points
            </Link>

            <Link
              href="/#espacios"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'espacios'
                  ? 'text-[#7A8B5C] bg-[#7A8B5C]/10 border border-[#7A8B5C]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-[#7A8B5C]" />
              Espacios
            </Link>

            {user?.role === 'comercio' && (
              <Link
                href="/comercio"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/30 hover:bg-[#FF6B1A]/20 transition-all"
              >
                <Store className="w-4 h-4 text-[#FF6B1A]" />
                Mi Negocio
              </Link>
            )}
          {user?.role === 'admin' && (
              <Link
                href="/admin/analytics"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'mapa'
                    ? 'text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4 text-[#FF6B1A]" />
                Mapa de Calor (Admin)
              </Link>
            )}
          </nav>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Tema con Rotación 180° (Regla 10) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-transform duration-200 active:scale-90 border border-white/10"
                aria-label="Cambiar tema"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-[#D4A24C] transition-transform duration-300 hover:rotate-90" />
                ) : (
                  <Moon className="w-4 h-4 text-[#C0C7D1] transition-transform duration-300 hover:-rotate-90" />
                )}
              </button>
            )}

            {/* Botón Carrito de Compras */}
            <Link
              href="/carrito"
              className={`relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all border border-white/10 ${
                isCartBouncing ? 'cart-bounce-anim text-[#FF6B1A]' : ''
              }`}
              aria-label="Abrir canasta"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF6B1A] text-white text-[10px] font-black flex items-center justify-center border-2 border-[#061734] badge-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Botón Mis Pedidos */}
            <Link
              href="/cliente/pedidos"
              className="hidden sm:flex items-center gap-1.5 p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all border border-white/10"
              title="Ver estado de mis pedidos"
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span className="hidden lg:inline">Mis Pedidos</span>
            </Link>

            {/* Saldo de Puntos (Solo si logueado) */}
            {user && (
              <div 
                onClick={() => onSelectTab && onSelectTab('puntos')}
                className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#061734] border border-[#D4A24C]/30 hover:border-[#D4A24C] transition-all"
                title="Tus Paseo Points"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A24C] animate-pulse" />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-white/60 uppercase font-semibold leading-none">Puntos</span>
                  <span className="text-xs font-black text-[#D4A24C] font-mono tabular-nums leading-none mt-0.5">
                    {user.points.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Botón Mi QR */}
            <button
              onClick={() => {
                if (user) {
                  setIsQrOpen(true);
                } else {
                  window.location.href = '/auth/login';
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino border border-white/20"
              title={user ? 'Mi Credencial QR' : 'Inicia sesión para ver tu QR'}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mi QR</span>
            </button>

            
            {/* Botón Menú Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Usuario autenticado o botón Ingresar */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'comercio' && (
                  <Link
                    href="/comercio"
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 text-[#FF6B1A] hover:bg-[#FF6B1A]/30 transition-all shadow-sm"
                    title="Panel Mi Tienda & Caja"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Mi Tienda</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin/overview"
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D4A24C]/20 border border-[#D4A24C]/40 text-[#D4A24C] hover:bg-[#D4A24C]/30 transition-all shadow-sm"
                    title="Panel de Administración"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Panel Admin</span>
                  </Link>
                )}

                {/* Chip con Identificación Visible del Usuario */}
                <Link
                  href={user.role === 'comercio' ? '/comercio' : user.role === 'admin' ? '/admin/overview' : '/cliente/perfil'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 transition-all group max-w-[190px]"
                  title={'Sesión activa de ' + user.name + ' (' + (user.role || 'cliente').toUpperCase() + ') - Clic para ver perfil'}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#B84D0B] to-[#FF6B1A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-white/20">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#FF6B1A] transition-colors leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#D4A24C] font-semibold leading-tight capitalize truncate">
                      {user.role === 'admin' ? '👑 Admin' : user.role === 'comercio' ? '🏪 Comercio' : (user.points || 0) + ' pts'}
                    </span>
                  </div>
                </Link>

                {/* Botón Cerrar Sesión Claro y Visible */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold transition-all shadow-sm"
                    title="Cerrar sesión de Paseo Aranjuez"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                    <span className="sm:hidden">Salir</span>
                  </button>
                )}
              </div>
            ) : (
              <a
                href="/auth/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino border border-white/20 shadow-md hover:brightness-110 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Menú Desplegable Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden sticky top-[65px] z-40 w-full backdrop-blur-2xl bg-[#061734]/98 border-b border-white/15 px-4 py-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tarjeta de Usuario Identificado en Mobile */}
          {user ? (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B84D0B] to-[#FF6B1A] text-white flex items-center justify-center font-black text-sm shadow-md border border-white/20">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-white/90 uppercase tracking-wide">
                        {user.role === 'admin' ? '👑 Admin' : user.role === 'comercio' ? '🏪 Comercio' : 'Cliente'}
                      </span>
                      <span className="text-xs font-black text-[#D4A24C] font-mono">
                        {(user.points || 0).toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={user.role === 'comercio' ? '/comercio' : user.role === 'admin' ? '/admin/overview' : '/cliente/perfil'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 text-[#FF6B1A] text-xs font-bold hover:bg-[#FF6B1A]/30 transition-all"
                >
                  Perfil
                </Link>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-200 font-bold text-xs transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#B84D0B]/20 to-[#FF6B1A]/20 border border-[#FF6B1A]/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">¿Tienes cuenta en Paseo?</p>
                <p className="text-[11px] text-white/70">Ingresa para acumular puntos y retiros</p>
              </div>
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md hover:brightness-110 transition-all"
              >
                Ingresar
              </Link>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
          >
            Inicio
          </Link>
          <Link
            href="/cliente"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#FF6B1A] hover:bg-[#FF6B1A]/10 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-[#FF6B1A]" />
            PaseoYa
          </Link>
          <Link
            href="/jarvis"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#D4A24C] hover:bg-[#D4A24C]/10 transition-all"
          >
            <Bot className="w-4 h-4 text-[#D4A24C]" />
            Jarvis
          </Link>
          <Link
            href="/cliente/puntos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#FF8F4D] hover:bg-[#FF8F4D]/10 transition-all"
          >
            <Flame className="w-4 h-4 text-[#FF8F4D]" />
            Paseo Points
          </Link>
          <Link
            href="/#espacios"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#7A8B5C] hover:bg-[#7A8B5C]/10 transition-all"
          >
            <Compass className="w-4 h-4 text-[#7A8B5C]" />
            Espacios
          </Link>
          {user?.role === 'comercio' && (
            <Link
              href="/comercio"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#FF6B1A] hover:bg-[#FF6B1A]/10 transition-all"
            >
              <Store className="w-4 h-4 text-[#FF6B1A]" />
              Panel de Comercio (Mi Tienda)
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              href="/admin/analytics"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#FF6B1A] hover:bg-[#FF6B1A]/10 transition-all"
            >
              <Layers className="w-4 h-4 text-[#FF6B1A]" />
              Mapa de Calor (Admin)
            </Link>
          )}
          <Link
            href="/cliente/pedidos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
          >
            <ClipboardList className="w-4 h-4 text-[#D4A24C]" />
            Mis Pedidos
          </Link>
        </div>
      )}


      {/* Modal QR Pulsante */}
      {user && (
        <QrPulsanteModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          userName={user.name}
          points={user.points}
          level={user.level}
          pinCode="8821"
          qrToken={user.qrToken || "PASEO-VIP-001"}
        />
      )}
    </>
  );
}
