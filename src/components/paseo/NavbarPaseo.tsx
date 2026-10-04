'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, ShoppingBag, QrCode, Home, Bot, Award, ChevronRight, ShoppingCart } from 'lucide-react';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { QrPulsanteModal } from './QrPulsanteModal';
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
    email?: string;
    points: number;
    level: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
    role?: string;
    qrToken?: string;
  } | null;
}
export function NavbarPaseo({ user, onLogout, cartCount = 0 }: NavbarPaseoProps) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(false);
  const admin = user?.role === 'admin';
  const staff = user?.role === 'comercio' || user?.role === 'empleado';
  const home = admin ? '/admin/overview' : staff ? '/comercio' : '/';
  const links = admin
    ? [
        ['/admin/overview', 'Administración'],
        ['/admin/stores', 'Establecimientos'],
        ['/admin/users', 'Usuarios'],
      ]
    : staff
      ? [
          ['/comercio', 'Pedidos'],
          ['/comercio/scanner', 'Caja y validación'],
          ...(user?.role === 'comercio' ? [['/comercio/empleados', 'Mi equipo']] : []),
        ]
      : [
          ['/', 'Inicio'],
          ['/cliente', 'PaseoYa'],
          ['/cliente/puntos', 'Paseo Points'],
          ['/jarvis', 'Jarvis'],
        ];

  /* Close mobile menu on resize to desktop */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1200px)');
    const handler = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const profile = (
    <>
      {user && (
        <div className="session-card">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <span className="role-badge">
            {user.role}
            {user.role === 'cliente' && ' · ' + user.points + ' pts · ' + user.level}
          </span>
        </div>
      )}
      {user ? (
        <button className="button secondary small" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      ) : (
        <Link className="button small" href="/auth/login">
          Ingresar
        </Link>
      )}
    </>
  );

  return (
    <>
      <header className="paseo-header">
        <div className="paseo-header-inner">
          <Link href={home} aria-label="Paseo Aranjuez — Inicio">
            <PaseoAranjuezLogo />
          </Link>
          <nav className="paseo-desktop-links" aria-label="Navegación principal">
            {links.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="paseo-desktop-session">{profile}</div>
          {!admin && !staff && (
            <Link
              href="/carrito"
              className="icon-button nav-cart-button"
              aria-label={'Carrito, ' + cartCount + ' productos'}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}
          <button
            className="paseo-menu-button icon-button"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="paseo-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="mobile-menu-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Mobile Slide-in Menu */}
      <nav
        id="paseo-mobile-menu"
        className={`paseo-mobile-menu ${open ? 'mobile-menu-open' : ''}`}
        aria-label="Menú móvil"
      >
        {/* User profile section at top */}
        {user ? (
          <div className="mobile-user-section">
            <div className="mobile-user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="mobile-user-info">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
              <span className="role-badge">
                {user.role}
                {user.role === 'cliente' && ` · ${user.points} pts · ${user.level}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="mobile-user-section">
            <Link href="/auth/login" className="button" onClick={() => setOpen(false)} style={{ width: '100%', textAlign: 'center' }}>
              Ingresar o Registrarse
            </Link>
          </div>
        )}

        {/* Navigation links */}
        <div className="mobile-nav-links">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="mobile-nav-link">
              <span>{label}</span>
              <ChevronRight size={16} />
            </Link>
          ))}
          {user?.role === 'cliente' && (
            <>
              <Link href="/cliente/pedidos" onClick={() => setOpen(false)} className="mobile-nav-link">
                <span>Mis pedidos</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/carrito" onClick={() => setOpen(false)} className="mobile-nav-link">
                <span>Mi carrito {cartCount > 0 && `(${cartCount})`}</span>
                <ChevronRight size={16} />
              </Link>
              <button className="mobile-nav-link" onClick={() => { setQr(true); setOpen(false); }}>
                <span>Mi código QR</span>
                <QrCode size={16} />
              </button>
            </>
          )}
        </div>

        {/* Logout at bottom */}
        {user && (
          <div className="mobile-menu-footer">
            <button className="button secondary small" onClick={() => { onLogout?.(); setOpen(false); }} style={{ width: '100%' }}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      {/* Floating cart for mobile */}
      {!admin && !staff && cartCount > 0 && (
        <Link href="/carrito" className="floating-cart" aria-label={`Carrito con ${cartCount} productos`}>
          <ShoppingCart size={22} />
          <span className="floating-cart-count">{cartCount}</span>
        </Link>
      )}

      {user?.role === 'cliente' && (
        <QrPulsanteModal
          isOpen={qr}
          onClose={() => setQr(false)}
          userName={user.name}
          points={user.points}
          level={user.level}
          qrToken={user.qrToken}
          pinCode={user.qrToken}
        />
      )}
    </>
  );
}
