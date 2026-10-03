'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  ShoppingBag,
  Sparkles,
  Gift,
  UserRound,
  MapPin,
  LogOut,
  LayoutDashboard,
  Compass,
  Layers,
} from 'lucide-react';
import { useCart, useSession } from './Providers';
import { homeFor } from '@/lib/paseo/model';
import { toast } from 'sonner';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/cliente', label: 'PaseoYa', icon: ShoppingBag },
  { href: '/jarvis', label: 'Jarvis', icon: Sparkles },
  { href: '/cliente/puntos', label: 'Paseo Points', icon: Gift },
  { href: '/#espacios', label: 'Espacios', icon: Compass },
  { href: '/admin/analytics', label: 'Mapa de Calor', icon: Layers },
];

export function Shell({ children, demo }: { children: React.ReactNode; demo: boolean }) {
  const { user, logout } = useSession();
  const cart = useCart();
  const pathname = usePathname();

  if (pathname === '/') return <main id="main">{children}</main>;

  const active = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/cliente') {
      return (
        pathname === '/cliente' ||
        pathname.startsWith('/cliente/tiendas/') ||
        pathname.startsWith('/producto/')
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <div className="announcement">
        <span>
          <MapPin size={13} className="text-[#FF6B1A]" /> Encuentra tu próximo plan. Vívelo en el Paseo.
        </span>
        {demo && <span className="demo-label">Entorno de demostración</span>}
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Paseo Aranjuez, inicio">
            <PaseoAranjuezLogo size="sm" showSubtitle={false} />
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={active(l.href) ? 'active' : ''}>
                {l.icon && (
                  <l.icon
                    size={14}
                    className={
                      l.href === '/jarvis'
                        ? 'text-[#D4A24C]'
                        : l.href === '/cliente/puntos'
                        ? 'text-[#FF8F4D]'
                        : ''
                    }
                  />
                )}
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link
              className="cart-link"
              href="/carrito"
              aria-label={`Carrito, ${cart.count} productos`}
            >
              <ShoppingBag size={20} />
              {cart.count > 0 && <span className="badge-pulse">{cart.count}</span>}
            </Link>
            {user ? (
              <>
                {user.points !== undefined && (
                  <Link href="/cliente/puntos" className="points-pill" title="Tus Paseo Points">
                    <Sparkles size={12} className="text-[#D4A24C]" />
                    <span>{user.points} pts</span>
                  </Link>
                )}
                <Link
                  className="account-button"
                  href={user.role === 'cliente' ? '/cliente/perfil' : homeFor(user.role)}
                  title={`Mi cuenta: ${user.name}`}
                >
                  <UserRound size={16} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  className="icon-button signout"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  onClick={() => logout().catch((e) => toast.error(e.message))}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link className="button small" href="/auth/login">
                Ingresar <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div
          className="header-inner"
          style={{
            flexDirection: 'column',
            height: 'auto',
            gap: '20px',
            textAlign: 'center',
            padding: '36px 0',
          }}
        >
          <Link className="brand" href="/" style={{ justifyContent: 'center' }}>
            <PaseoAranjuezLogo size="sm" showSubtitle={true} />
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
            Descubre, disfruta y vuelve. El centro comercial y empresarial de Cochabamba.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/cliente" style={{ color: 'inherit' }}>
              Tiendas
            </Link>
            <Link href="/jarvis" style={{ color: 'inherit' }}>
              Asistente Jarvis
            </Link>
            <Link href="/cliente/puntos" style={{ color: 'inherit' }}>
              Paseo Points
            </Link>
            <Link href="/admin/analytics" style={{ color: 'inherit' }}>
              Mapa de Calor
            </Link>
            <Link href="/auth/login" style={{ color: 'inherit' }}>
              Acceso comercios
            </Link>
          </div>
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
            © {new Date().getFullYear()} Paseo Aranjuez. Todos los derechos reservados.
          </small>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        <Link href="/" className={active('/') ? 'active' : ''}>
          <span>Inicio</span>
        </Link>
        <Link href="/cliente" className={active('/cliente') ? 'active' : ''}>
          <ShoppingBag size={20} />
          <span>PaseoYa</span>
        </Link>
        <Link href="/cliente/puntos" className={active('/cliente/puntos') ? 'active' : ''}>
          <Gift size={20} />
          <span>Puntos</span>
        </Link>
        <Link href="/jarvis" className={active('/jarvis') ? 'active' : ''}>
          <Sparkles size={20} />
          <span>Jarvis</span>
        </Link>
        <Link
          href={user && user.role !== 'cliente' ? homeFor(user.role) : '/cliente/perfil'}
          className={active('/cliente/perfil') ? 'active' : ''}
        >
          <UserRound size={20} />
          <span>{user ? user.name.split(' ')[0] : 'Cuenta'}</span>
        </Link>
      </nav>
      {pathname !== '/jarvis' && (
        <Link className="jarvis-float" href="/jarvis" aria-label="Pregúntale a Jarvis">
          <Sparkles size={19} />
          <span>¿Un plan? Jarvis te ayuda</span>
        </Link>
      )}
    </>
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
    ['analytics', 'Estadísticas y Calor'],
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
    <aside className="panel-nav">
      <div
        className="panel-brand"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #B84D0B, #FF6B1A)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <LayoutDashboard size={20} />
        </div>
        <div>
          <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>
            {role === 'admin' ? 'Administración' : 'Mi establecimiento'}
          </strong>
          <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            Paseo Aranjuez
          </small>
        </div>
      </div>
      <nav
        aria-label={`Panel ${role}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        {(role === 'admin' ? admin : commerce).map(([route, label]) => {
          const href = `/${role}${route ? '/' + route : ''}`;
          return (
            <Link href={href} key={href} className={pathname === href ? 'active' : ''}>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
