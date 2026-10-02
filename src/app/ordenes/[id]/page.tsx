'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/context/StoreContext';
import type { OrderStatus } from '@/lib/types';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  ShieldAlert,
  Star,
  DollarSign,
  Share2,
  Check,
  User,
  Navigation,
  Gift,
  Store,
  Building,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface TimelineStep {
  status: OrderStatus;
  title: string;
  description: string;
}

const ORDER_TIMELINE: TimelineStep[] = [
  { status: 'pending', title: 'Pedido Creado', description: 'Orden recibida en el sistema' },
  { status: 'paid', title: 'Pago / Anticipo Validado', description: 'Transacción verificada por la tienda' },
  { status: 'preparing', title: 'En Preparación Táctica', description: 'El equipo está empacando tu equipamiento' },
  { status: 'ready', title: 'Listo para Despacho / Retiro', description: 'Listo en almacén para retiro o entrega' },
  { status: 'in_transit', title: 'En Camino / En Ruta', description: 'En camino con repartidor o despacho a flota' },
  { status: 'delivered', title: 'Entregado / Retirado', description: 'Misión cumplida, paquete recibido' },
];

function getStatusRank(status: OrderStatus): number {
  switch (status) {
    case 'pending': return 0;
    case 'paid': return 1;
    case 'preparing': return 2;
    case 'ready': return 3;
    case 'assigned':
    case 'picked_up':
    case 'in_transit': return 4;
    case 'delivered': return 5;
    case 'cancelled':
    case 'refunded': return -1;
    default: return 0;
  }
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const { orders, storeSettings, rateDriver, cancelOrder } = useStore();
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [hasRated, setHasRated] = useState<boolean>(false);

  const order = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 pt-32 text-center">
          <div className="glass-card-static p-8 border border-white/[0.08]">
            <ShieldAlert size={48} className="text-[#C8A961] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Orden No Encontrada</h1>
            <p className="text-sm text-neutral-400 mb-6">
              No hemos localizado la orden con identificador <code className="text-[#C8A961] font-mono">{orderId}</code>.
            </p>
            <Link href="/ordenes" className="btn-tactical inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Ver Mis Órdenes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentRank = getStatusRank(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isPending = order.status === 'pending';

  // Driver details
  const driverName = order.driver?.full_name || 'Carlos Mendoza (Driver Táctico)';
  const driverPhone = order.driver?.phone || '+591 76543210';
  const driverCleanPhone = driverPhone.replace(/[^0-9]/g, '');

  const whatsappMessage = encodeURIComponent(
    `¡Hola ${driverName}! Te escribo sobre mi orden #${order.id.toUpperCase()} de Tienda Táctica Bolivia a la dirección: ${order.customer_address || ''}.`
  );
  const whatsappUrl = `https://wa.me/${driverCleanPhone}?text=${whatsappMessage}`;

  const handleShareTracking = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace de tracking copiado al portapapeles');
    }
  };

  const handleCancel = () => {
    if (confirm('¿Estás seguro de cancelar esta orden?')) {
      cancelOrder(order.id, 'Cancelado por el cliente desde la app');
    }
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    rateDriver(order.id, selectedRating, reviewText);
    setHasRated(true);
  };

  const getStatusHeadline = () => {
    switch (order.status) {
      case 'pending':
        return {
          title: 'Pendiente de Pago',
          subtitle: 'Esperando validación de transferencia o comprobante QR.',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Clock,
        };
      case 'paid':
        return {
          title: 'Pago / Anticipo Confirmado',
          subtitle: 'Orden validada. El equipo pasará a empacar tu equipamiento en almacén.',
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: CheckCircle2,
        };
      case 'preparing':
        return {
          title: 'En Preparación Táctica',
          subtitle: 'El personal está alistando los productos y verificando sellos de calidad.',
          badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          icon: Package,
        };
      case 'ready':
        return {
          title: order.delivery_type === 'pickup' ? '¡Listo para Retiro en Tienda! 🏬' : 'Listo para Reparto 📦',
          subtitle: order.delivery_type === 'pickup'
            ? `Tu paquete está en almacén: ${order.pickup_location || storeSettings.pickupAddress}.`
            : 'Empacado en punto central, esperando que el conductor inicie la ruta.',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Navigation,
        };
      case 'assigned':
      case 'picked_up':
      case 'in_transit':
        return {
          title: order.delivery_type === 'national_shipping' ? 'En Tránsito por Flota / Courier 🚛' : '¡Tu Pedido está en Camino! 🚚',
          subtitle: order.delivery_type === 'national_shipping'
            ? `Despachado con destino a ${order.destination_department || 'departamento'}.`
            : `El repartidor ${driverName} está en ruta hacia tu dirección.`,
          badgeColor: 'bg-[#C8A961]/10 text-[#C8A961] border-[#C8A961]/30',
          icon: Truck,
        };
      case 'delivered':
        return {
          title: '¡Misión Cumplida! Pedido Entregado 🎉',
          subtitle: `Entregado satisfactoriamente el ${new Date(order.delivered_at || order.created_at).toLocaleDateString('es-BO')}.`,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          title: 'Orden Cancelada',
          subtitle: order.cancellation_reason || 'Esta orden ha sido anulada.',
          badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: XCircle,
        };
      default:
        return {
          title: 'Seguimiento de Orden',
          subtitle: 'Operación en curso.',
          badgeColor: 'bg-white/10 text-white border-white/20',
          icon: Clock,
        };
    }
  };

  const headline = getStatusHeadline();
  const HeadlineIcon = headline.icon;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-32 sm:pb-24">
        {/* Top actions */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.push('/ordenes')}
            className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> MIS ÓRDENES
          </button>

          <button
            onClick={handleShareTracking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-mono text-neutral-300 transition"
          >
            <Share2 size={13} className="text-[#C8A961]" /> Compartir Enlace
          </button>
        </div>

        {/* Big Status Banner */}
        <div className="glass-card-static p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <HeadlineIcon size={28} className="text-[#C8A961]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-neutral-400 uppercase">
                    ORDEN #{order.id.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${headline.badgeColor}`}>
                    {order.status}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {headline.title}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-lg">
                  {headline.subtitle}
                </p>
              </div>
            </div>

            {/* Price badge in Bolivianos (Bs.) */}
            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">IMPORTE TOTAL (BOLIVIA)</div>
              <div className="text-2xl font-mono font-black text-[#C8A961]">Bs. {order.total.toFixed(2)}</div>
              <div className="text-[10px] text-neutral-400">
                {order.payment_mode === 'full_payment'
                  ? '100% Pagado por QR'
                  : order.payment_mode === 'partial_payment'
                  ? `Anticipo 50%: Bs. ${(order.paid_amount || 0).toFixed(2)}`
                  : 'Pago Contra Entrega'}
              </div>
            </div>
          </div>
        </div>

        {/* FREE SOUVENIR PROMO BANNER IF INCLUDED */}
        {order.free_gift && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#C8A961]/20 via-amber-500/10 to-[#C8A961]/20 border border-[#C8A961] mb-6 flex items-center justify-between gap-4 shadow-lg shadow-[#C8A961]/10 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8A961] flex items-center justify-center text-black font-bold flex-shrink-0">
                <Gift size={22} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C8A961] font-bold tracking-wider block">
                  SOUVENIR TÁCTICO SORPRESA INCLUIDO
                </span>
                <span className="text-sm font-bold text-white">
                  🎁 Regalo Táctico Sorpresa Oficial (Edición Especial)
                </span>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  ¡Beneficio por pago 100% con QR! Un regalo táctico secreto viaja empacado junto con tu orden. ¡Descúbrelo al recibir tu paquete!
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold whitespace-nowrap">
              GRATIS (Bs. 0.00)
            </span>
          </div>
        )}

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Timeline & Logistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Timeline Card */}
            <div className="glass-card-static p-6 border border-white/[0.08]">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A961] mb-6 flex items-center justify-between">
                <span>SEGUIMIENTO OPERATIVO EN TIEMPO REAL</span>
                <span className="text-[10px] text-neutral-500 font-normal">Actualización automática</span>
              </h2>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
                {ORDER_TIMELINE.map((step, idx) => {
                  const stepRank = getStatusRank(step.status);
                  const isReached = !isCancelled && currentRank >= stepRank;
                  const isCurrent = !isCancelled && currentRank === stepRank;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      {/* Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-[#C8A961] border-[#C8A961] shadow-lg shadow-[#C8A961]/40 scale-110'
                            : isReached
                            ? 'bg-[#0A0A0B] border-[#C8A961] text-[#C8A961]'
                            : 'bg-[#141416] border-neutral-700 text-neutral-600'
                        }`}
                      >
                        {isReached && !isCurrent ? (
                          <Check size={12} strokeWidth={3} className="text-[#C8A961]" />
                        ) : isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-black animate-ping" />
                        ) : (
                          <span className="text-[10px] font-mono">{idx + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold tracking-tight ${
                              isCurrent
                                ? 'text-[#C8A961]'
                                : isReached
                                ? 'text-white'
                                : 'text-neutral-500'
                            }`}
                          >
                            {step.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[#C8A961]/20 text-[#C8A961] text-[9px] font-mono font-bold uppercase animate-pulse">
                              ETAPA ACTUAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isPending && (
                <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-neutral-400">¿Deseas cancelar esta orden antes de pagar?</span>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                  >
                    Cancelar Pedido
                  </button>
                </div>
              )}
            </div>

            {/* Delivery-specific card */}
            {order.delivery_type === 'pickup' && (
              <div className="glass-card-static p-6 border border-[#C8A961]/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Store size={18} className="text-[#C8A961]" /> Retiro en Tienda / Almacén Central
                </div>
                <div className="text-xs text-neutral-300">
                  <strong className="text-white">Dirección: </strong>{order.pickup_location || storeSettings.pickupAddress}
                </div>
                <div className="text-xs text-[#C8A961] flex items-center gap-1">
                  <Calendar size={13} /> <strong>Horario Elegido: </strong>{order.pickup_time || storeSettings.pickupSchedule}
                </div>
                <p className="text-[11px] text-neutral-400 pt-1">
                  {storeSettings.pickupInstructions}
                </p>
              </div>
            )}

            {order.delivery_type === 'national_shipping' && (
              <div className="glass-card-static p-6 border border-blue-500/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Building size={18} className="text-blue-400" /> Envío Nacional por Flota / Courier
                </div>
                <div className="text-xs text-neutral-300">
                  <strong className="text-white">Departamento de Destino: </strong>{order.destination_department || 'Bolivia'}
                </div>
                <div className="text-xs text-neutral-300">
                  <strong className="text-white">Terminal o Destino de Entrega: </strong>{order.customer_address}
                </div>
                <p className="text-[11px] text-neutral-400 pt-1">
                  Se emitirá la guía de transporte terrestre interdepartamental. Recibirás la foto del comprobante de encomienda en tu WhatsApp.
                </p>
              </div>
            )}

            {order.delivery_type === 'delivery' && (currentRank >= 3 || isDelivered) && (
              <div className="glass-card-static p-6 border border-[#C8A961]/30 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#C8A961]/10 border border-[#C8A961]/30 flex items-center justify-center text-[#C8A961] flex-shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#C8A961] uppercase tracking-wider block">
                        REPARTIDOR MOTORIZADO ASIGNADO
                      </span>
                      <h3 className="text-base font-bold text-white">{driverName}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                        <span className="flex items-center text-amber-400 gap-1 font-semibold">
                          <Star size={12} fill="currentColor" /> 4.9
                        </span>
                        <span>· Operador en Bolivia</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                    >
                      <MessageCircle size={15} /> WhatsApp Repartidor
                    </a>
                    <a
                      href={`tel:${driverCleanPhone}`}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition border border-white/[0.08]"
                      title="Llamar"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Rating section */}
            {isDelivered && (
              <div className="glass-card-static p-6 border border-white/[0.08]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A961] mb-2 flex items-center gap-2">
                  <Star size={14} className="text-[#C8A961]" /> CALIFICACIÓN DE SERVICIO
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Tu opinión mantiene los más altos estándares tácticos en cada entrega.
                </p>

                {hasRated || order.customer_rating ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
                    <CheckCircle2 size={20} />
                    <div>
                      <div className="font-bold">¡Calificación Registrada!</div>
                      <div className="text-neutral-300 mt-0.5">
                        Has calificado esta entrega con {order.customer_rating || selectedRating} estrellas.
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedRating(star)}
                          className="p-1 text-2xl transition hover:scale-125 focus:outline-none"
                        >
                          <Star
                            size={26}
                            className={star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono text-neutral-400 ml-2">
                        {selectedRating} de 5 Estrellas
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Deja un comentario sobre la atención y rapidez..."
                      className="input-tactical text-xs py-2"
                    />

                    <button type="submit" className="btn-tactical text-xs py-2 px-4">
                      Enviar Calificación
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Financial Breakdown & Payment status */}
          <div className="space-y-6">
            <div className="glass-card-static p-5 border border-white/[0.08] space-y-3 text-xs">
              <h3 className="font-mono font-bold uppercase tracking-widest text-[#C8A961] pb-2 border-b border-white/[0.06]">
                ESTADO FINANCIERO // BS.
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Monto Total Orden:</span>
                  <span className="font-mono font-bold text-white">Bs. {order.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>Pagado Anticipadamente (QR):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    Bs. {(order.paid_amount || 0).toFixed(2)}
                  </span>
                </div>

                {order.pending_amount !== undefined && order.pending_amount > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <div className="flex justify-between font-bold">
                      <span>Saldo Pendiente al Recibir:</span>
                      <span className="font-mono text-sm">Bs. {order.pending_amount.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Pagas este saldo al repartidor o encargado al recibir tu paquete.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="glass-card-static p-5 border border-white/[0.08] space-y-2.5 text-xs">
              <h3 className="font-mono font-bold uppercase tracking-widest text-[#C8A961] pb-1 border-b border-white/[0.06]">
                DATOS DEL DESTINATARIO
              </h3>
              <div>
                <span className="text-neutral-500 block">Cliente:</span>
                <strong className="text-white">{order.customer_name || 'Cliente'}</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">WhatsApp Bolivia:</span>
                <span className="font-mono text-emerald-400">{order.customer_phone || 'Sin número'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Dirección / Punto:</span>
                <span className="text-neutral-300">{order.customer_address || order.pickup_location}</span>
              </div>
              {order.delivery_notes && (
                <div className="p-2.5 rounded bg-white/[0.03] text-[11px] text-neutral-400">
                  <strong className="text-neutral-300">Notas: </strong>{order.delivery_notes}
                </div>
              )}
            </div>

            {/* Direct WhatsApp Support */}
            <a
              href={`https://wa.me/59178494191?text=${encodeURIComponent(`Hola Tienda Táctica, tengo una consulta sobre mi Orden #${order.id.toUpperCase()} por Bs. ${order.total.toFixed(2)}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition active:scale-98 shadow-sm"
            >
              <MessageCircle size={15} />
              <span>Contactar Soporte por WhatsApp</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
