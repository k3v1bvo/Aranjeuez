'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Grid2X2,
  ShoppingBag,
  Sparkles,
  Gift,
  UserRound,
  MapPin,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useCart, useSession } from './Providers';
import { homeFor } from '@/lib/paseo/model';
import { toast } from 'sonner';

const links = [
  { href: '/cliente', label: 'PaseoYa', icon: ShoppingBag },
  { href: '/cliente/puntos', label: 'Paseo Points', icon: Gift },
  { href: '/jarvis', label: 'Jarvis', icon: Sparkles },
];
export function Shell({ children, demo }: { children: React.ReactNode; demo: boolean }) {
  const { user, logout } = useSession();
  const cart = useCart();
  const pathname = usePathname();
  if (pathname === '/') return <main id="main">{children}</main>;
  const active = (href: string) =>
    href === '/cliente'
      ? pathname === '/cliente' ||
        pathname.startsWith('/cliente/tiendas/') ||
        pathname.startsWith('/producto/')
      : pathname.startsWith(href);
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <div className="announcement">
        <span>
          <MapPin size={13} /> Encuentra tu próximo plan. Vívelo en el Paseo.
        </span>
        {demo && <span className="demo-label">Entorno de demostración</span>}
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Paseo Aranjuez, inicio">
            <span className="brand-mark">
              <Grid2X2 size={26} />
            </span>
            <span>
              PASEO<span className="brand-sub">ARANJUEZ</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={active(l.href) ? 'active' : ''}>
                {l.label}
                {l.href === '/jarvis' && <Sparkles size={13} />}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link
              className="cart-link"
              href="/carrito"
              aria-label={`Carrito, ${cart.count} productos`}
            >
              <ShoppingBag size={21} />
              {cart.count > 0 && <span>{cart.count}</span>}
            </Link>
            {user ? (
              <>
                <Link
                  className="account-button"
                  href={user.role === 'cliente' ? '/cliente/perfil' : homeFor(user.role)}
                >
                  <UserRound size={17} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  className="icon-button signout"
                  aria-label="Cerrar sesión"
                  onClick={() => logout().catch((e) => toast.error(e.message))}
                >
                  <LogOut size={17} />
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
        <Link className="brand" href="/">
          <Grid2X2 size={24} />
          <span>Paseo Aranjuez</span>
        </Link>
        <p>Descubre, disfruta y vuelve.</p>
        <div>
          <Link href="/cliente">Tiendas</Link>
          <Link href="/jarvis">Asistente</Link>
          <Link href="/auth/login">Acceso comercios</Link>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {links.map((l) => (
          <Link href={l.href} key={l.href} className={active(l.href) ? 'active' : ''}>
            <l.icon size={21} />
            <span>{l.label}</span>
          </Link>
        ))}
        <Link href={user && user.role !== 'cliente' ? homeFor(user.role) : '/cliente/perfil'}>
          <UserRound size={21} />
          <span>Mi cuenta</span>
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
    <aside className="panel-nav">
      <div className="panel-brand">
        <LayoutDashboard size={21} />
        <div>
          <strong>{role === 'admin' ? 'Administración' : 'Mi establecimiento'}</strong>
          <small>Paseo Aranjuez</small>
        </div>
      </div>
      <nav aria-label={`Panel ${role}`}>
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
