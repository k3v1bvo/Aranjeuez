'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { demoDrivers } from '@/lib/demo-data';
import type { OrderStatus } from '@/lib/types';
import {
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Navigation,
  RefreshCw,
  ExternalLink,
  User,
  MapPin,
  Phone,
  Gift,
  Store,
  Bike,
  Bus,
  Sparkles,
  Calendar,
  X,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const statusConfig: Record<OrderStatus, { label: string; badge: string; icon: any }> = {
  pending: { label: 'Pendiente', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  paid: { label: 'Pagado', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
  preparing: { label: 'En Preparación', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Package },
  ready: { label: 'Listo para Despacho', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Navigation },
  assigned: { label: 'Repartidor Asignado', badge: 'bg-[#C8A961]/10 text-[#C8A961] border-[#C8A961]/30', icon: Truck },
  picked_up: { label: 'Recogido', badge: 'bg-[#C8A961]/10 text-[#C8A961] border-[#C8A961]/30', icon: Truck },
  in_transit: { label: 'En Camino', badge: 'bg-[#C8A961]/20 text-[#C8A961] border-[#C8A961]', icon: Truck },
  delivered: { label: 'Entregado', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  refunded: { label: 'Reembolsado', badge: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: RefreshCw },
};

const deliveryTypeConfig: Record<string, { label: string; icon: any; badge: string }> = {
  pickup: { label: 'Recojo Almacén', icon: Store, badge: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  delivery: { label: 'Delivery Urbano', icon: Bike, badge: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  national_shipping: { label: 'Flota / Courier Nal.', icon: Bus, badge: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
};

const paymentModeConfig: Record<string, { label: string; badge: string }> = {
  full_payment: { label: '100% QR (Sorpresa 🎁)', badge: 'text-[#C8A961] bg-[#C8A961]/10 border-[#C8A961]/30' },
  partial_payment: { label: '50% Anticipo / 50% Saldo', badge: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  cash_on_delivery: { label: 'Contra Entrega', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
};

export default function AdminSalesPage() {
  const { orders, shippingZones, adminSetOrderStatus, adminAssignDriver, storeSettings } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o =>
          o.id.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      result = result.filter(o => o.shipping_zone_id === zoneFilter);
    }

    if (deliveryFilter !== 'all') {
      result = result.filter(o => (o.delivery_type || 'delivery') === deliveryFilter);
    }

    return result;
  }, [orders, searchQuery, statusFilter, zoneFilter, deliveryFilter]);

  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId) || null
    : null;

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Cliente,Telefono,Direccion,Modalidad,Pago,Total_Bs,Pagado_Bs,Saldo_Bs,Regalo,Estado,Fecha']
        .concat(
          filteredOrders.map(
            o =>
              `"${o.id}","${o.customer_name || ''}","${o.customer_phone || ''}","${o.customer_address || ''}","${o.delivery_type || 'delivery'}","${o.payment_mode || 'full_payment'}","${o.total}","${o.paid_amount || o.total}","${o.pending_amount || 0}","${o.free_gift || 'Ninguno'}","${o.status}","${o.created_at}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ordenes_tacticas_bolivia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV exportado exitosamente');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">
            CONTROL DE VENTAS & DESPACHO // BOLIVIA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ventas & Órdenes Tácticas
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitoreo de pagos en Bolivianos (Bs.), recojo en almacén, delivery local y flota nacional.
          </p>
        </div>

        <button onClick={handleExport} className="btn-outline-gold text-xs px-4 py-2 flex items-center gap-2">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card-static p-4 flex flex-wrap gap-3 items-center border border-white/[0.06]">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-tactical pl-9 py-2 text-xs"
          />
        </div>

        <select
          value={deliveryFilter}
          onChange={e => setDeliveryFilter(e.target.value)}
          className="input-tactical w-auto py-2 text-xs"
        >
          <option value="all">Todas las modalidades</option>
          <option value="pickup">🏪 Recojo en Almacén</option>
          <option value="delivery">🛵 Delivery Urbano</option>
          <option value="national_shipping">🚌 Flota Nal. / Courier</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="input-tactical w-auto py-2 text-xs"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
          className="input-tactical w-auto py-2 text-xs"
        >
          <option value="all">Todas las zonas</option>
          {shippingZones.map(z => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table and Details Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table of Orders */}
        <div className="xl:col-span-2 glass-card-static border border-white/[0.06] overflow-hidden">
          {/* Mobile Card List (visible on sm:hidden) */}
          <div className="block sm:hidden divide-y divide-white/[0.06]">
            {filteredOrders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const isSelected = selectedOrderId === order.id;
              const delType = deliveryTypeConfig[order.delivery_type || 'delivery'] || deliveryTypeConfig.delivery;
              const payMode = paymentModeConfig[order.payment_mode || 'full_payment'] || paymentModeConfig.full_payment;
              const DelIcon = delType.icon;

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    document.getElementById('order-detail-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 transition cursor-pointer active:bg-white/[0.04] ${
                    isSelected ? 'bg-[#C8A961]/10 border-l-2 border-[#C8A961]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        #{order.id.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(order.created_at).toLocaleDateString('es-BO')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <div>
                      <span className="font-semibold text-neutral-200 block">{order.customer_name || 'Cliente'}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">{order.customer_phone || 'Sin WhatsApp'}</span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-[#C8A961] text-sm">Bs. {order.total.toFixed(2)}</div>
                      {order.pending_amount && order.pending_amount > 0 ? (
                        <div className="text-[10px] text-cyan-400">Saldo: Bs. {order.pending_amount.toFixed(2)}</div>
                      ) : (
                        <div className="text-[10px] text-emerald-400">100% Pagado</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${delType.badge}`}>
                        <DelIcon size={10} /> {delType.label}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono border ${payMode.badge}`}>
                        {payMode.label}
                      </span>
                      {order.free_gift && (
                        <span className="text-[9px] text-[#C8A961] flex items-center gap-1 font-bold">
                          <Gift size={9} /> Regalo 🎁
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="text-[11px] font-mono text-[#C8A961] flex items-center gap-1 hover:underline"
                    >
                      {isSelected ? 'Gestionando' : 'Gestionar'} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-neutral-500 text-xs">
                No se encontraron órdenes coincidentes con los filtros.
              </div>
            )}
          </div>

          {/* Desktop Table (hidden on sm:hidden) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table-tactical w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono">
                  <th className="py-3 px-4">Orden</th>
                  <th className="py-3 px-4">Cliente / Entrega</th>
                  <th className="py-3 px-4">Modalidad & Pago</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Total (Bs.)</th>
                  <th className="py-3 px-4">Despacho</th>
                  <th className="py-3 px-4 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredOrders.map(order => {
                  const config = statusConfig[order.status] || statusConfig.pending;
                  const isSelected = selectedOrderId === order.id;
                  const delType = deliveryTypeConfig[order.delivery_type || 'delivery'] || deliveryTypeConfig.delivery;
                  const payMode = paymentModeConfig[order.payment_mode || 'full_payment'] || paymentModeConfig.full_payment;
                  const DelIcon = delType.icon;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-white/[0.02] cursor-pointer transition ${
                        isSelected ? 'bg-[#C8A961]/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-white">
                          #{order.id.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-neutral-500">
                          {new Date(order.created_at).toLocaleDateString('es-BO')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-200">
                          {order.customer_name || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {order.customer_phone || 'Sin tel.'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border w-max ${delType.badge}`}>
                            <DelIcon size={11} /> {delType.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono border w-max ${payMode.badge}`}>
                            {payMode.label}
                          </span>
                          {order.free_gift && (
                            <span className="text-[10px] text-[#C8A961] flex items-center gap-1 font-bold">
                              <Gift size={10} /> +Regalo Sorpresa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.badge}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#C8A961]">
                        Bs. {order.total.toFixed(2)}
                        {order.pending_amount && order.pending_amount > 0 ? (
                          <div className="text-[10px] text-cyan-400 font-normal">
                            Saldo: Bs. {order.pending_amount.toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-normal">
                            100% Pagado
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        {order.delivery_type === 'pickup' ? (
                          <span className="text-[11px] text-amber-400 flex items-center gap-1">
                            <Store size={12} /> Tienda Central
                          </span>
                        ) : order.delivery_type === 'national_shipping' ? (
                          <span className="text-[11px] text-purple-400 flex items-center gap-1">
                            <Bus size={12} /> Flota {order.destination_department || 'Nacional'}
                          </span>
                        ) : order.driver_id ? (
                          <span className="text-xs text-neutral-300 flex items-center gap-1">
                            <Truck size={12} className="text-[#C8A961]" /> Repartidor Asignado
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">Por asignar</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id === selectedOrderId ? null : order.id);
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-neutral-500">
                      No se encontraron órdenes coincidentes con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail & Action Panel */}
        <div className="xl:col-span-1" id="order-detail-panel">
          {selectedOrder ? (
            <div className="glass-card-static p-5 border border-[#C8A961]/30 space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="font-mono text-[10px] text-neutral-500 uppercase block">
                    DETALLE OPERATIVO // BOLIVIA
                  </span>
                  <div className="font-mono text-base font-bold text-white">
                    #{selectedOrder.id.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white sm:hidden flex items-center gap-1 text-[10px] font-mono transition"
                    title="Cerrar detalle"
                  >
                    <X size={12} /> Cerrar
                  </button>

                  <Link
                    href={`/ordenes/${selectedOrder.id}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#C8A961] flex items-center gap-1 text-[10px] font-mono transition"
                    title="Ver pantalla del cliente"
                  >
                    <ExternalLink size={12} /> Ver en Vivo
                  </Link>
                </div>
              </div>

              {/* Status banner */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span>Estado Actual:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    statusConfig[selectedOrder.status]?.badge || ''
                  }`}
                >
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              {/* Souvenir alert if applicable */}
              {selectedOrder.free_gift && (
                <div className="p-3 rounded-xl bg-[#C8A961]/10 border border-[#C8A961]/30 flex items-start gap-2.5">
                  <Gift size={16} className="text-[#C8A961] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#C8A961] text-xs">¡Empacar Regalo Táctico Sorpresa!</div>
                    <div className="text-[11px] text-neutral-300 mt-0.5">{selectedOrder.free_gift}</div>
                  </div>
                </div>
              )}

              {/* Delivery Type & Destination Info */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Modalidad de Entrega:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${deliveryTypeConfig[selectedOrder.delivery_type || 'delivery']?.badge || ''}`}>
                    {deliveryTypeConfig[selectedOrder.delivery_type || 'delivery']?.label || selectedOrder.delivery_type}
                  </span>
                </div>

                {selectedOrder.delivery_type === 'pickup' && (
                  <div className="pt-2 border-t border-white/[0.04] space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <Calendar size={13} /> Horario acordado: {selectedOrder.pickup_time || storeSettings.pickupSchedule}
                    </div>
                    <div className="text-neutral-400 flex items-start gap-1.5 text-[11px]">
                      <MapPin size={13} className="text-neutral-500 flex-shrink-0 mt-0.5" />
                      <span>{selectedOrder.pickup_location || storeSettings.pickupAddress}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.delivery_type === 'national_shipping' && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-neutral-400">Destino Flota:</span>
                    <span className="font-mono text-purple-400 font-bold ml-2">
                      {selectedOrder.destination_department || 'Interdepartamental'}
                    </span>
                  </div>
                )}
              </div>

              {/* Recipient details */}
              <div className="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <User size={13} className="text-[#C8A961]" /> {selectedOrder.customer_name || 'Cliente'}
                </div>
                <div className="text-neutral-400 flex items-center gap-1.5">
                  <Phone size={13} className="text-neutral-500" /> {selectedOrder.customer_phone || 'Sin WhatsApp'}
                </div>
                {selectedOrder.customer_address && (
                  <div className="text-neutral-400 flex items-start gap-1.5 pt-1">
                    <MapPin size={13} className="text-neutral-500 flex-shrink-0 mt-0.5" />
                    <span>{selectedOrder.customer_address}</span>
                  </div>
                )}
              </div>

              {/* Financial summary in Bolivianos */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal productos:</span>
                  <span className="font-mono font-medium text-white">
                    Bs. {(selectedOrder.total - selectedOrder.shipping_cost).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Costo de Envío:</span>
                  <span className="font-mono text-[#C8A961]">
                    {selectedOrder.shipping_cost === 0 ? 'Bs. 0.00 (Gratis)' : `+Bs. ${selectedOrder.shipping_cost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1.5 border-t border-white/[0.06]">
                  <span>Total Orden:</span>
                  <span className="font-mono text-sm text-[#C8A961]">Bs. {selectedOrder.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-emerald-400 text-[11px] pt-1 border-t border-white/[0.04]">
                  <span>Pagado con QR:</span>
                  <span className="font-mono font-bold">Bs. {(selectedOrder.paid_amount || selectedOrder.total).toFixed(2)}</span>
                </div>
                {selectedOrder.pending_amount && selectedOrder.pending_amount > 0 ? (
                  <div className="flex justify-between text-cyan-400 font-bold text-[11px]">
                    <span>Saldo a Cobrar en Entrega:</span>
                    <span className="font-mono">Bs. {selectedOrder.pending_amount.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>

              {/* Admin Pipeline Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="font-mono uppercase text-[10px] text-neutral-400 font-bold">
                  TRANSICIONES DEL DUEÑO:
                </div>

                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => adminSetOrderStatus(selectedOrder.id, 'paid', 'Pago validado por admin')}
                    className="btn-tactical w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} /> Validar Pago (Pasar a Pagado)
                  </button>
                )}

                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => adminSetOrderStatus(selectedOrder.id, 'preparing', 'Iniciada preparación en almacén')}
                    className="btn-tactical w-full py-2.5 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 border-orange-500"
                  >
                    <Package size={14} /> Marcar en Preparación (Almacén)
                  </button>
                )}

                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => adminSetOrderStatus(selectedOrder.id, 'ready', 'Listo para retiro / despacho')}
                    className="btn-tactical w-full py-2.5 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 border-purple-500"
                  >
                    <Navigation size={14} /> {selectedOrder.delivery_type === 'pickup' ? 'Notificar Listo para Recoger en Tienda' : 'Marcar LISTO para Despacho'}
                  </button>
                )}

                {/* Ready state for pickup: complete delivery */}
                {selectedOrder.status === 'ready' && selectedOrder.delivery_type === 'pickup' && (
                  <button
                    onClick={() => adminSetOrderStatus(selectedOrder.id, 'delivered', 'Cliente retiró el producto en almacén')}
                    className="btn-tactical w-full py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                  >
                    <CheckCircle2 size={14} /> Confirmar Entrega en Almacén
                  </button>
                )}

                {/* Manual Driver Assignment (only for delivery) */}
                {selectedOrder.delivery_type === 'delivery' && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                      Asignar Repartidor Manualmente:
                    </label>
                    <div className="flex gap-2">
                      <select
                        defaultValue={selectedOrder.driver_id || ''}
                        onChange={e => {
                          if (e.target.value) {
                            adminAssignDriver(selectedOrder.id, e.target.value);
                          }
                        }}
                        className="input-tactical text-xs py-1.5 flex-1"
                      >
                        <option value="">Seleccionar Conductor...</option>
                        {demoDrivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.full_name} ({d.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Cancellation with reason */}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo de cancelación:');
                      if (reason) adminSetOrderStatus(selectedOrder.id, 'cancelled', reason);
                    }}
                    className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition mt-2"
                  >
                    Cancelar Pedido con Motivo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card-static p-12 text-center border border-white/[0.06] text-neutral-500 text-xs">
              <Eye size={28} className="mx-auto mb-2 text-neutral-600" />
              Selecciona una orden de la lista para ver su seguimiento detallado, modalidad y transiciones.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
