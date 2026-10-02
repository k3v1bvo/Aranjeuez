'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  TrendingUp,
  Truck,
  ShoppingBag,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Wallet
} from 'lucide-react';

export default function DriverDashboardPage() {
  const { orders, driverEarnings, isDriverAvailable, toggleDriverAvailability } = useStore();

  // Driver metrics
  const myCompletedOrders = orders.filter(o => o.status === 'delivered');
  const myActiveOrders = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));

  // Compute earnings
  const pendingEarnings = driverEarnings
    .filter(e => e.status === 'pending')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalEarnings = driverEarnings.reduce((acc, e) => acc + Number(e.amount), 0);

  // Ratings calculation
  const ratedOrders = myCompletedOrders.filter(o => o.customer_rating);
  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((acc, o) => acc + (o.customer_rating || 5), 0) / ratedOrders.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner with Availability Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card-static p-6 border border-white/[0.08]">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">
            ESTADÍSTICAS DEL CONDUCTOR // REPARTO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard de Ganancias & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Control de comisiones por zona, historial de liquidaciones y pedidos en ruta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDriverAvailability}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 border ${
              isDriverAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isDriverAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span>{isDriverAvailable ? 'ESTADO: DISPONIBLE' : 'ESTADO: EN DESCANSO'}</span>
          </button>

          <Link href="/vendor/orders" className="btn-tactical text-xs px-4 py-2.5 flex items-center gap-1.5">
            <Truck size={14} /> Ver Mi Ruta ({myActiveOrders.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Pendiente de Pago */}
        <div className="glass-card-static p-5 border border-[#C8A961]/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-neutral-400">Saldo Por Liquidar</span>
            <div className="w-8 h-8 rounded-lg bg-[#C8A961]/10 flex items-center justify-center text-[#C8A961]">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-3xl font-mono font-black text-[#C8A961]">
            Bs. {pendingEarnings.toFixed(2)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Pendiente de pago por el administrador
          </p>
        </div>

        {/* Ganancias Totales */}
        <div className="glass-card-static p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-neutral-400">Ganancias Totales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-3xl font-mono font-black text-white">
            Bs. {totalEarnings.toFixed(2)}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp size={11} /> Acumulado histórico de comisiones
          </p>
        </div>

        {/* Envíos Completados */}
        <div className="glass-card-static p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-neutral-400">Envíos Completados</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-mono font-black text-white">
            {myCompletedOrders.length}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {myActiveOrders.length} entregas activas en curso
          </p>
        </div>

        {/* Rating del Conductor */}
        <div className="glass-card-static p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-neutral-400">Rating de Operador</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Star size={16} fill="currentColor" />
            </div>
          </div>
          <div className="text-3xl font-mono font-black text-amber-400 flex items-baseline gap-1">
            {avgRating} <span className="text-xs text-neutral-500 font-normal">/ 5.0</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Basado en {ratedOrders.length || 1} reseñas de clientes
          </p>
        </div>
      </div>

      {/* 2-Columns: Active Deliveries & Earnings History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <div className="glass-card-static p-5 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#C8A961]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Entregas Activas en Ruta
              </h2>
            </div>
            <Link href="/vendor/orders" className="text-xs text-[#C8A961] hover:underline font-mono">
              Ver Todas →
            </Link>
          </div>

          {myActiveOrders.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No tienes pedidos asignados actualmente en ruta.
              <div className="mt-2">
                <Link href="/vendor/orders" className="btn-outline-gold text-xs px-3 py-1.5 inline-block">
                  Explorar Pedidos Disponibles
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myActiveOrders.map(order => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        #{order.id.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C8A961]/20 text-[#C8A961] border border-[#C8A961]">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-300 mt-1 line-clamp-1">
                      {order.customer_name} · {order.customer_address}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#C8A961]">
                      +Bs. {(order.driver_commission || 10).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">Comisión</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earnings breakdown */}
        <div className="glass-card-static p-5 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-[#C8A961]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Comisiones & Liquidaciones
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              HISTORIAL
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {driverEarnings.map(earning => (
              <div
                key={earning.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-white">
                      Orden #{earning.order_id.split('-')[1] || earning.order_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                        earning.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {earning.status === 'paid' ? 'Liquidado' : 'Por Cobrar'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {new Date(earning.created_at).toLocaleDateString('es-BO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-[#C8A961] text-sm">
                    +Bs. {Number(earning.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {driverEarnings.length === 0 && (
              <div className="py-10 text-center text-neutral-500 text-xs">
                Aún no hay comisiones registradas. ¡Completa tu primer reparto!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
