'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Package, Users, CreditCard,
  BarChart3, ScrollText, AlertTriangle, Settings, Shield,
  Menu, X, ChevronLeft, Bell, LogOut, Navigation, Truck, ArrowLeft
} from 'lucide-react';

const navItems = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/sales', label: 'Ventas & Órdenes', icon: ShoppingCart },
  { href: '/admin/shipping-zones', label: 'Zonas de Envío', icon: Navigation },
  { href: '/admin/drivers', label: 'Repartidores', icon: Truck },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/users', label: 'Usuarios & Roles', icon: Users },
  { href: '/admin/payments', label: 'Pagos & QR', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analíticas', icon: BarChart3 },
  { href: '/admin/audit', label: 'Auditoría', icon: ScrollText },
  { href: '/admin/alerts', label: 'Alertas', icon: AlertTriangle },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, userName, userEmail } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Block non-admin/vendor access
  if (role === 'client') {
    return (
      <div className="min-h-screen bg-tactical-900 flex items-center justify-center">
        <div className="text-center glass-card-static p-8">
          <Shield size={40} className="text-red-alert mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-tactical-400 text-sm mb-4">No tienes permisos para acceder al panel de administración.</p>
          <Link href="/" className="btn-tactical">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const pendingAlerts = 3; // Demo

  return (
    <div className="min-h-screen bg-tactical-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col border-r border-white/[0.06] bg-tactical-950/95 backdrop-blur-xl transition-all duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-tactical-900" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-sm font-bold text-white tracking-tight block">TÁCTICA</span>
              <span className="text-[10px] text-amber-accent font-semibold tracking-wider">ADMIN PANEL</span>
            </div>
          )}
          {/* Collapse button (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto p-1 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            <ChevronLeft size={16} className={`text-tactical-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          {/* Close (mobile only) */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1">
            <X size={18} className="text-tactical-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.href === '/admin/alerts' && pendingAlerts > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-alert text-[10px] font-bold flex items-center justify-center text-white">
                    {pendingAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        {!collapsed && (
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-accent/20 flex items-center justify-center text-amber-accent text-xs font-bold">
                {userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-tactical-200 truncate">{userName}</div>
                <div className="text-[10px] text-tactical-500 truncate">{userEmail}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] bg-tactical-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05]">
              <Menu size={20} className="text-tactical-400" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-white">
                {navItems.find(i => i.href === pathname)?.label || 'Admin'}
              </h2>
              <span className="text-[11px] text-tactical-500">Panel de administración</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="btn-ghost text-xs inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#C8A961]/40"
              title="Volver a la Tienda"
            >
              <ArrowLeft size={14} className="text-[#C8A961]" />
              <span className="hidden sm:inline">Tienda</span>
            </Link>
            <button className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
              <Bell size={18} className="text-tactical-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-alert" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
