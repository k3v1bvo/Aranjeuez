'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import {
  Truck,
  DollarSign,
  ShieldAlert,
  ArrowLeft,
  Navigation,
  Radio,
  Power,
} from 'lucide-react';

const driverNavItems = [
  { href: '/vendor/orders', label: 'Envíos & Ruta', icon: Truck },
  { href: '/vendor/dashboard', label: 'Mis Ganancias', icon: DollarSign },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentRole, user } = useAuth();
  const { isDriverAvailable, toggleDriverAvailability } = useStore();

  const isAuthorized = currentRole === 'vendor' || currentRole === 'admin';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="glass-card-static p-8 max-w-md w-full text-center space-y-4 border border-[#C8A961]/30">
          <div className="w-14 h-14 rounded-2xl bg-[#C8A961]/10 border border-[#C8A961]/20 flex items-center justify-center mx-auto text-[#C8A961]">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso para Repartidores</h2>
          <p className="text-neutral-400 text-sm">
            Este panel está diseñado para <strong className="text-white">Repartidores y Drivers</strong> de Tienda Táctica.
            Tu rol actual es <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-mono capitalize">{currentRole}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/" className="btn-tactical text-sm">
              Volver a la Tienda
            </Link>
            <p className="text-[11px] text-neutral-500">
              Usa el selector en la esquina superior para cambiar a modo <strong>Vendor (Repartidor)</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-white/[0.06] bg-[#0A0A0B]/90 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Tienda
          </Link>
          <div className="h-4 w-[1px] bg-white/[0.1]" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8A961] to-amber-600 flex items-center justify-center text-black font-bold">
              <Navigation size={16} />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-wide">PANEL REPARTIDOR</span>
              <span className="text-[10px] text-[#C8A961] block font-mono">DRIVER LOGISTICS OPS</span>
            </div>
          </div>
        </div>

        {/* Navigation links desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {driverNavItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C8A961]/15 text-[#C8A961] border border-[#C8A961]/30 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status toggle & Driver info */}
        <div className="flex items-center gap-3">
          {/* Availability Toggle */}
          <button
            onClick={toggleDriverAvailability}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition border ${
              isDriverAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Power size={12} />
            <span className="hidden sm:inline">
              {isDriverAvailable ? 'DISPONIBLE' : 'EN DESCANSO'}
            </span>
            <span className="sm:hidden">
              {isDriverAvailable ? 'ON' : 'OFF'}
            </span>
          </button>

          <Link
            href="/admin/overview"
            className="text-xs text-neutral-400 hover:text-[#C8A961] transition hidden sm:inline"
          >
            Admin →
          </Link>
        </div>
      </header>

      {/* Mobile subnav */}
      <div className="md:hidden border-b border-white/[0.06] bg-black/50 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {driverNavItems.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-[#C8A961]/20 text-[#C8A961] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
