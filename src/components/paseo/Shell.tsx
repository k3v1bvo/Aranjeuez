'use client';

import Link from 'next/link';
import { MobileBottomDock } from './MobileBottomDock';
import { usePathname } from 'next/navigation';
import { useCart, useSession } from './Providers';
import { NavbarPaseo } from './NavbarPaseo';
import { FooterPaseo } from './FooterPaseo';
import { toast } from 'sonner';
import { LayoutDashboard } from 'lucide-react';

export function Shell({ children }: { children: React.ReactNode; demo?: boolean }) {
  const { user, logout, loading } = useSession();
  const cart = useCart();
  const pathname = usePathname();

  let activeTab = 'inicio';
  if (pathname === '/') activeTab = 'inicio';
  else if (pathname.startsWith('/cliente/puntos')) activeTab = 'puntos';
  else if (pathname.startsWith('/cliente') || pathname.startsWith('/producto'))
    activeTab = 'paseoya';
  else if (pathname.startsWith('/jarvis')) activeTab = 'jarvis';
  else if (pathname.startsWith('/admin/analytics')) activeTab = 'mapa';

  const currentUserData = user
    ? {
        name: user.name,
        email: user.email,
        points: user.points || 0,
        level: ((user.points || 0) >= 1000
          ? 'Platino'
          : (user.points || 0) >= 500
            ? 'Oro'
            : (user.points || 0) >= 200
              ? 'Plata'
              : 'Bronce') as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
        role: user.role,
        qrToken: user.qr_token,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#030B1A] text-white flex flex-col font-sans selection:bg-[#FF6B1A] selection:text-white">
      {loading ? (
        <header className="paseo-header">
          <div className="paseo-header-inner">Paseo Aranjuez</div>
        </header>
      ) : (
        <NavbarPaseo
          activeTab={activeTab}
          cartCount={cart.count}
          user={currentUserData}
          onLogout={() => logout().catch((e) => toast.error(e.message))}
        />
      )}

      <main
        className={
          !user || user.role === 'cliente' ? 'flex-1 w-full pb-20 md:pb-0' : 'flex-1 w-full'
        }
        id="main"
      >
        {children}
      </main>

      {!loading && user?.role !== 'admin' && user?.role !== 'empleado' && <FooterPaseo />}
      <MobileBottomDock />
    </div>
  );
}

export function PanelNav({ role }: { role: 'admin' | 'comercio' | 'empleado' }) {
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
    ['qrs', 'Tótems & QRs'],
    ['analytics', 'Estadísticas y Calor'],
    ['audit', 'Movimientos y auditoría'],
    ['alerts', 'Alertas'],
    ['settings', 'Configuración'],
  ];
  const commerce = [
    ['', 'Resumen y pedidos'],
    ['perfil', 'Mi Establecimiento'],
    ['empleados', 'Mi equipo'],
    ['productos', 'Mis productos'],
    ['scanner', 'Caja y validación'],
    ['promociones', 'Promociones'],
  ];
  return (
    <aside className="panel-nav w-full md:w-64 flex-shrink-0">
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
          <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Paseo Aranjuez</small>
        </div>
      </div>
      <nav
        aria-label={`Panel ${role}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        {(role === 'admin'
          ? admin
          : role === 'empleado'
            ? commerce.filter(([route]) => ['', 'scanner'].includes(route))
            : commerce
        ).map(([route, label]) => {
          const href = `/${role === 'empleado' ? 'comercio' : role}${route ? '/' + route : ''}`;
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
