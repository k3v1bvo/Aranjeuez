'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, Sparkles, ShoppingBag, Bot, Flame, Compass, Sun, Moon, 
  User, ClipboardList, Layers 
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
  cartCount?: number;
  user?: {
    name: string;
    points: number;
    level: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  };
}

export function NavbarPaseo({
  activeTab = 'inicio',
  onSelectTab,
  isDarkMode = true,
  onToggleTheme,
  onOpenAuth,
  onOpenCart,
  onOpenOrders,
  cartCount = 0,
  user = {
    name: MOCK_USER.name,
    points: MOCK_USER.points,
    level: MOCK_USER.level,
  },
}: NavbarPaseoProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

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
            <button
              onClick={() => onSelectTab && onSelectTab('inicio')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'inicio'
                  ? 'text-white bg-white/10 shadow-sm border border-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Inicio
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('paseoya')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'paseoya'
                  ? 'text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#FF6B1A]" />
              PaseoYa
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('jarvis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'jarvis'
                  ? 'text-[#D4A24C] bg-[#D4A24C]/10 border border-[#D4A24C]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-[#D4A24C]" />
              Jarvis
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('puntos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'puntos'
                  ? 'text-[#FF8F4D] bg-[#FF8F4D]/10 border border-[#FF8F4D]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4 text-[#FF8F4D]" />
              Paseo Points
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('espacios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'espacios'
                  ? 'text-[#7A8B5C] bg-[#7A8B5C]/10 border border-[#7A8B5C]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-[#7A8B5C]" />
              Espacios
            </button>
                      <button
              onClick={() => onSelectTab && onSelectTab('mapa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'mapa'
                  ? 'text-[#FF6B1A] bg-[#FF6B1A]/10 border border-[#FF6B1A]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-[#FF6B1A]" />
              Mapa de Calor
            </button>
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

            {/* Botón Carrito de Compras (Regla 18: Rebote 400ms) */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
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
              </button>
            )}

            {/* Botón Mis Pedidos */}
            {onOpenOrders && (
              <button
                onClick={onOpenOrders}
                className="hidden sm:flex items-center gap-1.5 p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all border border-white/10"
                title="Ver estado de mis pedidos"
              >
                <ClipboardList className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span className="hidden lg:inline">Mis Pedidos</span>
              </button>
            )}

            {/* Saldo de Puntos */}
            <div 
              onClick={() => onSelectTab && onSelectTab('puntos')}
              className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#061734] border border-[#D4A24C]/30 hover:border-[#D4A24C] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A24C] animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-white/60 uppercase font-semibold leading-none">Puntos</span>
                <span className="text-xs font-black text-[#D4A24C] font-mono tabular-nums leading-none mt-0.5">
                  {user.points.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Botón Mi QR */}
            <button
              onClick={() => setIsQrOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino border border-white/20"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mi QR</span>
            </button>

            {/* Avatar de Usuario con Anillo Giratorio de Nivel (Regla 18) / Botón Iniciar Sesión */}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="relative p-0.5 rounded-full group cursor-pointer"
                title={`Sesión de ${user.name} (Nivel ${user.level})`}
                aria-label="Perfil y Autenticación"
              >
                {/* Anillo de nivel con gradiente rotando 10s */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#B84D0B] via-[#D4A24C] to-[#FF6B1A] avatar-ring-rotating opacity-80 group-hover:opacity-100" />
                <div className="relative w-8 h-8 rounded-full bg-[#061734] border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  <User className="w-4 h-4 text-white/90 group-hover:text-[#FF6B1A] transition-colors" />
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal QR Pulsante */}
      <QrPulsanteModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        userName={user.name}
        points={user.points}
        level={user.level}
        pinCode={MOCK_USER.pinCode}
        qrToken={MOCK_USER.qrToken}
      />
    </>
  );
}
