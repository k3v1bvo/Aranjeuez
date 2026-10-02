'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/context/StoreContext';
import { demoProducts } from '@/lib/demo-data';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Navigation,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import Link from 'next/link';

const statusConfig: Record<OrderStatus, { label: string; badge: string; icon: any }> = {
  pending: { label: 'Pendiente', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  paid: { label: 'Pagado', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
  preparing: { label: 'En Preparación', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Package },
  ready: { label: 'Listo para Reparto', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Navigation },
  assigned: { label: 'Repartidor Asignado', badge: 'bg-[#C8A961]/10 text-[#C8A961] border-[#C8A961]/30', icon: Truck },
  picked_up: { label: 'Recogido', badge: 'bg-[#C8A961]/10 text-[#C8A961] border-[#C8A961]/30', icon: Truck },
  in_transit: { label: 'En Camino', badge: 'bg-[#C8A961]/20 text-[#C8A961] border-[#C8A961] animate-pulse', icon: Truck },
  delivered: { label: 'Entregado', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  refunded: { label: 'Reembolsado', badge: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: RefreshCw },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semana(s)`;
  return `Hace ${Math.floor(days / 30)} mes(es)`;
}

export default function OrdersPage() {
  const { orders } = useStore();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-32 sm:pb-24">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">
              CENTRO DE SEGUIMIENTO
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mis Órdenes Tácticas
            </h1>
          </div>

          <Link href="/" className="btn-outline-gold text-xs px-4 py-2 hidden sm:inline-flex items-center gap-1.5">
            <ShoppingBag size={14} /> Explorar Catálogo
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 glass-card-static border border-white/[0.08]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 text-[#C8A961]">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No tienes órdenes activas</h3>
            <p className="text-neutral-400 text-xs mb-6 max-w-sm mx-auto">
              Aún no has generado misiones de compra. Explora nuestro catálogo de equipamiento táctico profesional.
            </p>
            <Link href="/" className="btn-tactical text-xs px-6 py-2.5">
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <Link
                  key={order.id}
                  href={`/ordenes/${order.id}`}
                  className="glass-card-static p-5 border border-white/[0.06] hover:border-[#C8A961]/40 transition group block relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#C8A961] group-hover:scale-105 transition">
                        <StatusIcon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono group-hover:text-[#C8A961] transition">
                            #{order.id.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {timeAgo(order.created_at)} · {new Date(order.created_at).toLocaleDateString('es-BO')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-base font-black font-mono text-[#C8A961]">
                          Bs. {order.total.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {order.delivery_type === 'pickup'
                            ? 'Retiro Tienda'
                            : order.delivery_type === 'national_shipping'
                            ? 'Envío Flota'
                            : 'Delivery'} · {order.payment_mode === 'full_payment' ? '100% QR' : order.payment_mode === 'partial_payment' ? 'Anticipo 50%' : 'Contra Entrega'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] group-hover:bg-[#C8A961]/20 group-hover:text-[#C8A961] text-neutral-500 transition">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Customer / Destination & Items Preview */}
                  <div className="text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.04]">
                    <div>
                      {order.customer_address ? (
                        <span className="text-neutral-300 line-clamp-1">
                          📍 {order.customer_address}
                        </span>
                      ) : (
                        <span>{order.items?.length || 1} producto(s) en orden</span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-[#C8A961] group-hover:underline">
                      Ver Seguimiento en Vivo →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
