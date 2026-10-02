'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { demoDrivers } from '@/lib/demo-data';
import {
  Truck,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Ban,
  Wallet,
  Calendar,
  AlertCircle,
  Eye,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDriversPage() {
  const { orders, driverEarnings, isDriverAvailable, settleDriverEarnings, cashSettlements, reviewCashSettlement, getDriverCashOwed } = useStore();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('vendor-01');
  const [activeSection, setActiveSection] = useState<'drivers' | 'caja'>('drivers');
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Stats calculation
  const pendingEarnings = driverEarnings
    .filter(e => e.status === 'pending')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalPaidOut = driverEarnings
    .filter(e => e.status === 'paid')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const completedDeliveries = orders.filter(o => o.status === 'delivered');

  // Cash settlement stats
  const pendingSettlements = cashSettlements.filter(s => s.status === 'pending_review');
  const totalPendingCash = pendingSettlements.reduce((acc, s) => acc + s.amount, 0);
  const approvedSettlements = cashSettlements.filter(s => s.status === 'approved');
  const totalRecovered = approvedSettlements.reduce((acc, s) => acc + s.amount, 0);

  const handleSettleAll = () => {
    const pending = driverEarnings.filter(e => e.status === 'pending');
    if (pending.length === 0) {
      toast.info('No hay comisiones pendientes de liquidación');
      return;
    }
    pending.forEach(e => { settleDriverEarnings(e.id); });
    toast.success(`¡Se liquidaron ${pending.length} comisiones pendientes con éxito!`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">GESTIÓN DE FLOTA // REPARTIDORES</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Repartidores & Liquidación de Comisiones</h1>
          <p className="text-sm text-neutral-400 mt-1">Gestiona los repartidores, sus comisiones, y el cuadre de caja de efectivo.</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-white/[0.08] gap-2">
        <button onClick={() => setActiveSection('drivers')} className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'drivers' ? 'border-[#C8A961] text-[#C8A961]' : 'border-transparent text-neutral-400 hover:text-white'}`}>
          <Truck size={14} /> Conductores & Comisiones
        </button>
        <button onClick={() => setActiveSection('caja')} className={`pb-3 px-4 text-xs font-mono font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'caja' ? 'border-[#C8A961] text-[#C8A961]' : 'border-transparent text-neutral-400 hover:text-white'}`}>
          <Wallet size={14} /> Cuadre de Caja
          {pendingSettlements.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">{pendingSettlements.length}</span>
          )}
        </button>
      </div>

      {/* ====== DRIVERS SECTION ====== */}
      {activeSection === 'drivers' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card-static p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Comisiones Pendientes</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><DollarSign size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-[#C8A961]">Bs. {pendingEarnings.toFixed(2)}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Por pagar a conductores</span>
            </div>
            <div className="glass-card-static p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Total Liquidado</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-emerald-400">Bs. {totalPaidOut.toFixed(2)}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Total histórico liquidado</span>
            </div>
            <div className="glass-card-static p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Envíos Completados</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Truck size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-white">{completedDeliveries.length}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Entregas puerta a puerta exitosas</span>
            </div>
          </div>

          {/* Drivers List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card-static border border-white/[0.06] overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A961]">DIRECTORIO DE REPARTIDORES ACTIVOS</h2>
                <span className="text-xs text-neutral-500">{demoDrivers.length} Conductores</span>
              </div>
              <div className="overflow-x-auto">
                <table className="table-tactical w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono">
                      <th className="py-3 px-4">Conductor</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Entregas</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Por Liquidar</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {demoDrivers.map(driver => {
                      const driverDelivered = orders.filter(o => o.status === 'delivered' && (o.driver_id === driver.id || driver.id === 'vendor-01'));
                      const driverPending = driverEarnings.filter(e => e.status === 'pending' && (e.driver_id === driver.id || driver.id === 'vendor-01')).reduce((acc, e) => acc + Number(e.amount), 0);
                      const isAvailable = driver.id === 'vendor-01' ? isDriverAvailable : true;
                      return (
                        <tr key={driver.id} onClick={() => setSelectedDriverId(driver.id)} className={`hover:bg-white/[0.02] cursor-pointer transition ${selectedDriverId === driver.id ? 'bg-[#C8A961]/5' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#C8A961]/10 flex items-center justify-center text-[#C8A961] font-bold">{driver.full_name?.charAt(0) || 'D'}</div>
                              <div>
                                <div className="font-bold text-white text-sm">{driver.full_name}</div>
                                <div className="text-neutral-500 text-[11px]">{driver.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${isAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                              {isAvailable ? 'Disponible' : 'Descanso'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">{driverDelivered.length}</td>
                          <td className="py-3.5 px-4"><span className="flex items-center gap-1 text-amber-400 font-bold font-mono"><Star size={12} fill="currentColor" /> 4.9</span></td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#C8A961]">Bs. {driverPending.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right">
                            {driverPending > 0 ? (
                              <button onClick={e => { e.stopPropagation(); handleSettleAll(); }} className="px-2.5 py-1 rounded bg-[#C8A961]/20 hover:bg-[#C8A961]/30 text-[#C8A961] font-mono text-[10px] font-bold transition">PAGAR</button>
                            ) : (
                              <span className="text-[10px] text-neutral-500">Al día</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Driver Earnings Breakdown */}
            <div className="glass-card-static p-5 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A961]">HISTORIAL DE COMISIONES</h3>
                <span className="text-[10px] font-mono text-neutral-500">POR CONDUCTOR</span>
              </div>
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {driverEarnings.map(earning => (
                  <div key={earning.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-semibold text-white">Orden #{earning.order_id.split('-')[1] || earning.order_id}</div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        {new Date(earning.created_at).toLocaleDateString('es-BO')} · <span className={earning.status === 'paid' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{earning.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#C8A961] text-sm">+Bs. {Number(earning.amount).toFixed(2)}</span>
                      {earning.status === 'pending' && (
                        <button onClick={() => settleDriverEarnings(earning.id)} className="block mt-1 text-[10px] text-[#C8A961] hover:underline">Liquidar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====== CUADRE DE CAJA SECTION ====== */}
      {activeSection === 'caja' && (
        <>
          {/* Cash KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card-static p-5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Rendiciones Pendientes</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><Clock size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-amber-300">{pendingSettlements.length}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Por Bs. {totalPendingCash.toFixed(2)} en total</span>
            </div>
            <div className="glass-card-static p-5 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Efectivo Recuperado</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-emerald-400">Bs. {totalRecovered.toFixed(2)}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">{approvedSettlements.length} rendiciones aprobadas</span>
            </div>
            <div className="glass-card-static p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Total Rendiciones</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Wallet size={16} /></div>
              </div>
              <div className="text-3xl font-mono font-black text-white">{cashSettlements.length}</div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Historial completo</span>
            </div>
          </div>

          {/* Settlements List */}
          <div className="glass-card-static border border-white/[0.06] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8A961]">RENDICIONES DE EFECTIVO</h2>
              <span className="text-xs text-neutral-500">{cashSettlements.length} registros</span>
            </div>

            {cashSettlements.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 text-xs">
                <Wallet size={32} className="mx-auto mb-3 text-neutral-600" />
                No hay rendiciones de efectivo registradas aún. Cuando un repartidor cobre en efectivo y envíe su rendición, aparecerá aquí.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {cashSettlements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(settlement => (
                  <div key={settlement.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${settlement.status === 'pending_review' ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${settlement.status === 'pending_review' ? 'bg-amber-500/20 text-amber-400' : settlement.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {settlement.status === 'pending_review' ? <Clock size={20} /> : settlement.status === 'approved' ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{settlement.driver_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${settlement.status === 'pending_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : settlement.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                            {settlement.status === 'pending_review' ? 'PENDIENTE' : settlement.status === 'approved' ? 'APROBADA' : 'RECHAZADA'}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {new Date(settlement.created_at).toLocaleString('es-BO')} · {settlement.method === 'qr_transfer' ? '📲 QR Transfer' : '🏢 Entrega Física'} · {settlement.order_ids.length} orden(es)
                        </div>
                        {settlement.notes && <div className="text-[11px] text-neutral-400 mt-1 italic">&quot;{settlement.notes}&quot;</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-mono font-black text-[#C8A961]">Bs. {settlement.amount.toFixed(2)}</div>
                        {settlement.reviewed_by && <span className="text-[10px] text-neutral-500 block">por {settlement.reviewed_by}</span>}
                      </div>

                      {/* Proof image viewer */}
                      {settlement.proof_image_url && (
                        <button onClick={() => setViewProofUrl(settlement.proof_image_url!)} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-neutral-300 transition" title="Ver comprobante">
                          <Eye size={14} />
                        </button>
                      )}

                      {/* Approve/Reject actions */}
                      {settlement.status === 'pending_review' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => reviewCashSettlement(settlement.id, true, 'Admin')} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition" title="Aprobar">
                            <ThumbsUp size={14} />
                          </button>
                          <button onClick={() => reviewCashSettlement(settlement.id, false, 'Admin')} className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition" title="Rechazar">
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ====== PROOF IMAGE VIEWER MODAL ====== */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setViewProofUrl(null)}>
          <div className="relative max-w-2xl w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProofUrl(null)} className="absolute -top-4 -right-4 p-2 rounded-full bg-black/80 border border-white/[0.08] text-white hover:text-red-400 transition z-10"><X size={16} /></button>
            <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden border border-white/[0.1]">
              <Image src={viewProofUrl} alt="Comprobante de rendición" fill className="object-contain" sizes="700px" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
