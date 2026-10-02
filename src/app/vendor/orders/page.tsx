'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import {
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Package,
  Filter,
  Phone,
  MessageCircle,
  MapPin,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Star,
  Navigation,
  Wallet,
  QrCode,
  Upload,
  Building,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ImageUploader';

export default function DriverOrdersPage() {
  const {
    orders,
    shippingZones,
    driverAcceptOrder,
    driverPickupOrder,
    driverInTransit,
    driverDeliverOrder,
    isDriverAvailable,
    getDriverCashOwed,
    submitCashSettlement,
    cashSettlements,
    fixedAmountQRs,
    getQRForAmount,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Cash Settlement Modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState<'qr_transfer' | 'physical_delivery'>('qr_transfer');
  const [settlementProofUrl, setSettlementProofUrl] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  const driverId = 'vendor-01';
  const driverName = 'Repartidor Táctico';
  const cashOwed = getDriverCashOwed(driverId);

  const cashOrderIds = orders
    .filter(o => o.status === 'delivered' && (o.payment_mode === 'cash_on_delivery' || o.payment_mode === 'partial_payment') && (o.driver_id === driverId || driverId === 'vendor-01'))
    .map(o => o.id);

  const pendingSettlements = cashSettlements.filter(s => s.driver_id === driverId && s.status === 'pending_review');

  const handleSubmitSettlement = () => {
    if (cashOwed <= 0) {
      toast.info('No tienes efectivo pendiente por rendir');
      return;
    }
    if (settlementMethod === 'qr_transfer' && !settlementProofUrl) {
      toast.error('Debes subir la foto del comprobante de transferencia QR');
      return;
    }
    submitCashSettlement(driverId, driverName, cashOwed, settlementMethod, cashOrderIds, settlementProofUrl, settlementNotes);
    setShowSettlementModal(false);
    setSettlementProofUrl('');
    setSettlementNotes('');
  };

  // Tab 1: Available orders ready for pickup
  const availableOrders = orders.filter(o => o.status === 'ready');
  // Tab 2: Active deliveries
  const activeDeliveries = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
  // Tab 3: Delivered history
  const deliveredHistory = orders.filter(o => o.status === 'delivered');

  const getFilteredOrders = () => {
    let list = activeTab === 'available' ? availableOrders : activeTab === 'active' ? activeDeliveries : deliveredHistory;
    if (zoneFilter !== 'all') list = list.filter(o => o.shipping_zone_id === zoneFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o.id.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.customer_address?.toLowerCase().includes(q));
    }
    return list;
  };

  const filtered = getFilteredOrders();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">TERMINAL DE REPARTO // OPERATIVO</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Control de Envíos & Mi Ruta</h1>
          <p className="text-sm text-neutral-400 mt-1">Acepta pedidos preparados en almacén y gestiona el despacho puerta a puerta.</p>
        </div>
        {!isDriverAvailable && (
          <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle size={14} /> Modo &quot;En Descanso&quot; — No recibirás alertas de nuevos pedidos.
          </div>
        )}
      </div>

      {/* ============ CASH OWED CARD ============ */}
      {(cashOwed > 0 || pendingSettlements.length > 0) && (
        <div className="glass-card-static p-5 border border-amber-500/30 bg-gradient-to-r from-amber-900/10 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Wallet size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400/70 tracking-widest block">EFECTIVO POR RENDIR A LA TIENDA</span>
                <div className="text-2xl font-mono font-black text-amber-300">Bs. {cashOwed.toFixed(2)}</div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">De {cashOrderIds.length} pedido(s) cobrados en efectivo</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingSettlements.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold">
                  {pendingSettlements.length} rendición(es) en revisión
                </span>
              )}
              {cashOwed > 0 && (
                <button onClick={() => setShowSettlementModal(true)} className="btn-tactical text-xs px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-[#C8A961]/20">
                  <DollarSign size={14} /> RENDIR DINERO
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto">
        {(['available', 'active', 'history'] as const).map(tab => {
          const labels = { available: `Pedidos Disponibles (${availableOrders.length})`, active: `En Curso / Mi Ruta (${activeDeliveries.length})`, history: `Historial Entregados (${deliveredHistory.length})` };
          const icons = { available: <Package size={14} />, active: <Truck size={14} />, history: <CheckCircle2 size={14} /> };
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'border-[#C8A961] text-[#C8A961]' : 'border-transparent text-neutral-400 hover:text-white'}`}>
              {icons[tab]} {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="glass-card-static p-4 flex flex-wrap gap-3 items-center justify-between border border-white/[0.06]">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por orden, cliente o dirección..." className="input-tactical pl-9 py-2 text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-400" />
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="input-tactical py-2 text-xs w-auto">
            <option value="all">Todas las zonas de envío</option>
            {shippingZones.map(z => (<option key={z.id} value={z.id}>{z.name} (Bs. {z.driver_commission.toFixed(2)} com.)</option>))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filtered.map(order => {
          const zone = shippingZones.find(z => z.id === order.shipping_zone_id);
          const commission = order.driver_commission || zone?.driver_commission || 10;
          const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
          const waMessage = encodeURIComponent(`¡Hola ${order.customer_name || 'estimado'}! Soy el repartidor de Tienda Táctica en camino con tu orden #${order.id.toUpperCase()}.`);
          const waLink = `https://wa.me/${cleanPhone}?text=${waMessage}`;

          return (
            <div key={order.id} className={`glass-card-static p-5 border transition ${activeTab === 'available' ? 'border-purple-500/30 hover:border-[#C8A961]/50' : activeTab === 'active' ? 'border-[#C8A961]/40' : 'border-white/[0.06]'}`}>
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#C8A961] flex-shrink-0">
                    {order.status === 'ready' ? <Package size={20} /> : order.status === 'delivered' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Truck size={20} className="text-[#C8A961]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">#{order.id.toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${order.status === 'ready' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : order.status === 'assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : order.status === 'picked_up' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : order.status === 'in_transit' ? 'bg-[#C8A961]/20 text-[#C8A961] border-[#C8A961]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{order.status}</span>
                    </div>
                    <span className="text-xs text-neutral-400 block mt-0.5">Zona: <strong className="text-white">{zone?.name || 'Zona General'}</strong></span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">TU COMISIÓN</span>
                    <div className="text-lg font-mono font-black text-[#C8A961]">+Bs. {commission.toFixed(2)}</div>
                  </div>
                  {activeTab === 'available' && (
                    <button onClick={() => driverAcceptOrder(order.id)} className="btn-tactical text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-[#C8A961]/20 flex-1 sm:flex-initial">
                      <Navigation size={14} /> ACEPTAR PEDIDO
                    </button>
                  )}
                </div>
              </div>

              {/* Destination */}
              <div className="py-3.5 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-neutral-300">
                  <MapPin size={15} className="text-[#C8A961] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-semibold">{order.customer_name || 'Cliente'}</span>
                    <div className="text-neutral-400">{order.customer_address || 'Sin dirección registrada'}</div>
                  </div>
                </div>
                {order.delivery_notes && (
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-neutral-400 ml-6">
                    <strong className="text-neutral-300">Indicaciones: </strong>{order.delivery_notes}
                  </div>
                )}
              </div>

              {/* Amount to collect */}
              {order.pending_amount !== undefined && order.pending_amount > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2 mb-3">
                  <DollarSign size={16} className="text-amber-400 flex-shrink-0" />
                  <span><strong>COBRAR AL ENTREGAR: </strong>Bs. <strong className="text-white font-mono">{order.pending_amount.toFixed(2)}</strong> al cliente en mano o QR.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 size={15} /><span><strong>ORDEN PAGADA AL 100%</strong> — No cobrar nada al cliente.</span>
                </div>
              )}

              {/* Active Tab Actions */}
              {activeTab === 'active' && (
                <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {order.customer_phone ? (
                      <>
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 font-semibold text-xs flex items-center gap-1.5 transition"><MessageCircle size={14} /> WhatsApp</a>
                        <a href={`tel:${cleanPhone}`} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-neutral-300 transition" title="Llamar"><Phone size={14} /></a>
                      </>
                    ) : (<span className="text-[11px] text-neutral-500 italic">Sin teléfono registrado</span>)}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {order.status === 'assigned' && (<button onClick={() => driverPickupOrder(order.id)} className="btn-tactical text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto"><Package size={14} /> RECOGIDO EN TIENDA</button>)}
                    {order.status === 'picked_up' && (<button onClick={() => driverInTransit(order.id)} className="btn-tactical text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto"><Truck size={14} /> INICIAR RUTA</button>)}
                    {order.status === 'in_transit' && (<button onClick={() => driverDeliverOrder(order.id)} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20 w-full sm:w-auto"><CheckCircle2 size={14} /> CONFIRMAR ENTREGA</button>)}
                  </div>
                </div>
              )}

              {/* History Rating */}
              {activeTab === 'history' && order.customer_rating && (
                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1">Calificación: <strong className="text-amber-400 flex items-center gap-0.5"><Star size={12} fill="currentColor" /> {order.customer_rating}</strong></span>
                  {order.customer_review && <span className="italic text-neutral-500 max-w-sm truncate">&quot;{order.customer_review}&quot;</span>}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 glass-card-static border border-white/[0.06] text-neutral-500 text-xs">
            No se encontraron pedidos en la pestaña <strong className="text-neutral-300 capitalize">{activeTab}</strong>.
          </div>
        )}
      </div>

      {/* ============ CASH SETTLEMENT MODAL ============ */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={e => { if (e.target === e.currentTarget) setShowSettlementModal(false); }}>
          <div className="relative w-full max-w-lg rounded-2xl border border-[#C8A961]/30 bg-[#0B0B10]/98 max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A961] to-transparent" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2"><Wallet size={20} className="text-[#C8A961]" /> Rendir Efectivo a la Tienda</h2>
              <button onClick={() => setShowSettlementModal(false)} className="text-neutral-400 hover:text-white transition"><X size={20} /></button>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] font-mono uppercase text-amber-400/70 tracking-widest block">MONTO A RENDIR</span>
              <div className="text-3xl font-mono font-black text-amber-300 mt-1">Bs. {cashOwed.toFixed(2)}</div>
              <span className="text-[11px] text-neutral-400 block mt-1">{cashOrderIds.length} orden(es) con cobro en efectivo</span>
            </div>

            {/* Method Selection */}
            <div className="space-y-3">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">Método de Rendición</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSettlementMethod('qr_transfer')} className={`p-4 rounded-xl border text-center transition ${settlementMethod === 'qr_transfer' ? 'border-[#C8A961] bg-[#C8A961]/10 text-[#C8A961]' : 'border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:border-white/[0.15]'}`}>
                  <QrCode size={24} className="mx-auto mb-2" />
                  <span className="text-xs font-bold block">Transferencia QR</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Con comprobante</span>
                </button>
                <button onClick={() => setSettlementMethod('physical_delivery')} className={`p-4 rounded-xl border text-center transition ${settlementMethod === 'physical_delivery' ? 'border-[#C8A961] bg-[#C8A961]/10 text-[#C8A961]' : 'border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:border-white/[0.15]'}`}>
                  <Building size={24} className="mx-auto mb-2" />
                  <span className="text-xs font-bold block">Entrega Física</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">En Base Heroínas #560</span>
                </button>
              </div>
            </div>

            {/* QR Transfer: Display Store QR & Upload proof */}
            {settlementMethod === 'qr_transfer' && (() => {
              const settlementMatch = getQRForAmount(cashOwed);
              const storeQR = settlementMatch.qr || fixedAmountQRs.find(q => q.is_active && (q.is_default || q.amount === null)) || fixedAmountQRs[0];

              return (
                <div className="space-y-4">
                  {/* QR Oficial Tienda para el Repartidor */}
                  {storeQR ? (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-[#C8A961]/30 text-center space-y-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-[#C8A961] tracking-widest font-bold">
                          {settlementMatch.isExactMatch ? 'QR CON MONTO EXACTO ASIGNADO' : 'QR COMODÍN OFICIAL DE LA TIENDA'}
                        </span>
                        {settlementMatch.isExactMatch && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-bold">
                            Monto Bloqueado
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl inline-block shadow-xl mx-auto border-2 border-[#C8A961]/40">
                        <div className="relative w-40 h-40">
                          <Image
                            src={storeQR.qr_image_url}
                            alt="QR de Rendición Tienda Táctica"
                            fill
                            className="object-contain"
                            sizes="160px"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-neutral-300">
                        Transfiere <strong className="text-amber-300 font-mono font-bold">Bs. {cashOwed.toFixed(2)}</strong> a nombre de <strong className="text-white">{storeQR.account_name || 'Tienda Táctica Bolivia SRL'}</strong>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Banco: <strong className="text-white">{storeQR.bank_name || 'Simple QR Bolivia'}</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      No hay un código QR configurado en la matriz. Contacta a administración o realiza entrega física.
                    </div>
                  )}

                  {/* Subir Comprobante */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                      Comprobante de Transferencia (foto o captura bancaria)
                    </label>
                    {settlementProofUrl ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/[0.08]">
                        <Image src={settlementProofUrl} alt="Comprobante" fill className="object-contain" sizes="400px" />
                        <button onClick={() => setSettlementProofUrl('')} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:text-red-300 transition"><X size={14} /></button>
                      </div>
                    ) : (
                      <ImageUploader onChange={(url: string) => setSettlementProofUrl(url)} />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">Notas (opcional)</label>
              <textarea value={settlementNotes} onChange={e => setSettlementNotes(e.target.value)} placeholder={settlementMethod === 'physical_delivery' ? 'Ej: Paso a dejar el dinero hoy a las 18:00 en tienda' : 'Ej: Transferencia desde Banco Unión'} className="input-tactical text-xs w-full h-20 resize-none" />
            </div>

            <div className="sticky bottom-0 bg-[#0B0B10]/95 backdrop-blur-md -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-white/[0.08] z-20">
              <button onClick={handleSubmitSettlement} className="btn-tactical w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                {settlementMethod === 'qr_transfer' ? 'ENVIAR COMPROBANTE DE RENDICIÓN' : 'CONFIRMAR ENTREGA FÍSICA EN BASE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
