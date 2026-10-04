'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, LogOut, ShoppingBag, QrCode } from 'lucide-react';
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
  const profile = (
    <>
      {user && (
        <div className="session-card">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <span className="role-badge">
            {user.role}
            {user.role === 'cliente' && ' · ' + user.points + ' pts ? ' + user.level}
          </span>
        </div>
      )}
      {user ? (
        <button className="button secondary small" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut size={16} />
          <span>Cerrar sesión</span>
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
          <Link href={home} aria-label="Paseo Aranjuez · Inicio">
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
              className="icon-button"
              aria-label={'Carrito, ' + cartCount + ' productos'}
            >
              <ShoppingBag size={20} />
              <span>{cartCount}</span>
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
      {open && (
        <nav id="paseo-mobile-menu" className="paseo-mobile-menu" aria-label="Menú móvil">
          {profile}
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          {user?.role === 'cliente' && (
            <>
              <Link href="/cliente/pedidos" onClick={() => setOpen(false)}>
                Mis pedidos
              </Link>
              <button className="button secondary" onClick={() => setQr(true)}>
                <QrCode /> Mi QR
              </button>
            </>
          )}
        </nav>
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
