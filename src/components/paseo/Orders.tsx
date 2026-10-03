'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PackageCheck, RefreshCw, MapPin, Clock3, CheckCircle2, QrCode, ShoppingBag, X } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/paseo/model';
import { dateTime, money, ORDER_STEPS, STATUS_LABEL } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { Empty, ErrorState, Loading } from './UI';
import { Code } from './Code';

export function Orders({ commerce = false }: { commerce?: boolean }) {
  const { data, loading, error, reload } = useResource<{ orders: Order[] }>('pedidos', 15000);
  const { refresh } = useSession();
  const [filter, setFilter] = useState('todos');
  const [pending, setPending] = useState<{ order: Order; status: OrderStatus } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  function ask(order: Order, status: OrderStatus) {
    setPending({ order, status });
    setCode('');
    setFailure('');
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setFailure('');
    try {
      await api('pedidos', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: pending.order.id, status: pending.status, code }),
      });
      setPending(null);
      reload();
      void refresh();
      toast.success('Pedido actualizado con éxito');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos actualizar el pedido.');
    } finally {
      setBusy(false);
    }
  }

  const orders = (data?.orders || []).filter((o) => {
    if (filter === 'todos') return true;
    if (filter === 'activos') return !['entregado', 'cancelado'].includes(o.status);
    return o.status === filter;
  });

  return (
    <div className={commerce ? 'w-full' : 'py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-[#FF6B1A] tracking-widest block mb-1">
            {commerce ? 'Operación de Establecimiento' : 'Click & Collect · Retiro Presencial'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white">
            {commerce ? 'Gestión de Pedidos' : 'Mis Pedidos Activos'}
          </h1>
          <p className="text-xs text-white/60 mt-1">
            El estado se actualiza en tiempo real. Paga al retirar en el local o muestra tu QR.
          </p>
        </div>

        <button
          onClick={reload}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B1A]" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Toolbar Filtros */}
      <div className="flex items-center justify-between gap-4 mb-6 p-4 rounded-2xl glass-andino border border-white/10">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/60 font-semibold">Filtrar:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6B1A]"
          >
            <option value="todos">Todos los pedidos</option>
            <option value="activos">En curso (pendientes)</option>
            {Object.entries(STATUS_LABEL).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-white/40">{orders.length} pedidos encontrados</span>
      </div>

      {error && <ErrorState message={error} retry={reload} />}

      {loading ? (
        <div className="py-24 text-center">
          <Loading label="Cargando pedidos…" />
        </div>
      ) : !orders.length ? (
        <div className="py-16 text-center">
          <Empty
            title="Sin pedidos registrados"
            detail={
              commerce
                ? 'Aquí aparecerán los pedidos realizados por los clientes en tu local.'
                : 'Explora PaseoYa, compra online y retira sin filas en el local.'
            }
            href={commerce ? undefined : '/cliente'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-3xl glass-andino border border-white/10 p-6 sm:p-8 shadow-xl relative overflow-hidden"
            >
              {/* Head */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-mono text-[11px] font-bold">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-white/40">{dateTime(o.created_at)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-display">
                    {o.store?.name || 'Establecimiento Paseo'}
                  </h2>
                  {commerce && o.user && (
                    <p className="text-xs text-[#D4A24C] font-semibold mt-0.5">Cliente: {o.user.name}</p>
                  )}
                </div>

                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    o.status === 'listo'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                      : o.status === 'entregado'
                      ? 'bg-white/10 text-white/60 border-white/20'
                      : o.status === 'cancelado'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-[#FF6B1A]/20 text-[#FF6B1A] border-[#FF6B1A]/40'
                  }`}
                >
                  {STATUS_LABEL[o.status] || o.status}
                </span>
              </div>

              {/* Timeline Steps */}
              {o.status !== 'cancelado' && (
                <div className="mb-6 py-3 px-4 rounded-2xl bg-black/30 border border-white/5 overflow-x-auto">
                  <div className="flex items-center justify-between min-w-[420px] gap-2">
                    {ORDER_STEPS.map((step, idx) => {
                      const isDone = idx <= ORDER_STEPS.indexOf(o.status);
                      const isCurrent = o.status === step;
                      return (
                        <div key={step} className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isCurrent
                                ? 'bg-[#FF6B1A] text-white shadow-md shadow-[#FF6B1A]/40'
                                : isDone
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/10 text-white/40'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`text-xs font-semibold whitespace-nowrap ${
                              isCurrent ? 'text-[#FF6B1A]' : isDone ? 'text-white' : 'text-white/40'
                            }`}
                          >
                            {STATUS_LABEL[step]}
                          </span>
                          {idx < ORDER_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Body: Items & Pickup Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-xs uppercase font-bold text-white/50 mb-3 tracking-wider">
                    Artículos del Pedido
                  </h4>
                  <div className="space-y-2 mb-4">
                    {o.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <span className="text-white/90">
                          <strong className="text-white font-bold">{it.quantity}x</strong>{' '}
                          {it.product_name}
                        </span>
                        <span className="font-mono font-bold text-white/70">{money(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-baseline justify-between mb-3">
                    <span className="text-xs text-white/50">Total a pagar en mostrador:</span>
                    <span className="text-2xl font-black text-white font-mono">{money(o.total)}</span>
                  </div>

                  <div className="text-xs text-white/60 space-y-1">
                    <p className="flex items-center gap-1.5 text-[#D4A24C]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      <span>{o.store?.floor} · {o.store?.local_num}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-white/40">
                      <Clock3 className="w-3.5 h-3.5" />
                      <span>{o.store?.schedule || 'Horario de mall 10:00 - 21:00'}</span>
                    </p>
                  </div>
                </div>

                {/* Código de Retiro / QR */}
                {!commerce && !['cancelado', 'entregado'].includes(o.status) && (
                  <div className="p-6 rounded-2xl bg-black/40 border border-[#FF6B1A]/30 text-center flex flex-col items-center justify-center">
                    <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
                      Código de Retiro In Situ
                    </span>
                    <div className="text-3xl font-black font-mono text-white tracking-widest my-2 py-2 px-6 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                      {o.pickup_code}
                    </div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Muestra este código o tu credencial QR en caja
                    </p>
                    <div className="scale-90">
                      <Code type="order" token={o.qr_token} manual={o.pickup_code} label="" />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#D4A24C]">
                  {o.status === 'entregado' ? '✅ Sumaste' : '⭐ Al retirar sumarás'}:{' '}
                  <strong>+{o.points_earned} Paseo Points</strong>
                </div>

                <div className="flex items-center gap-2">
                  {!commerce && o.status === 'listo' && (
                    <button
                      onClick={() => ask(o, 'llego')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white text-xs font-bold btn-primary-andino flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ya estoy en el local</span>
                    </button>
                  )}

                  {commerce && ['recibido', 'confirmado', 'preparando'].includes(o.status) && (
                    <button
                      onClick={() =>
                        ask(
                          o,
                          (
                            {
                              recibido: 'confirmado',
                              confirmado: 'preparando',
                              preparando: 'listo',
                            } as Record<string, OrderStatus>
                          )[o.status],
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white text-xs font-bold btn-primary-andino"
                    >
                      {(
                        {
                          recibido: 'Confirmar pedido',
                          confirmado: 'Comenzar preparación',
                          preparando: 'Marcar listo para retirar',
                        } as Record<string, string>
                      )[o.status]}
                    </button>
                  )}

                  {commerce && ['listo', 'llego'].includes(o.status) && (
                    <button
                      onClick={() => ask(o, 'entregado')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Validar entrega y cobro</span>
                    </button>
                  )}

                  {((!commerce && o.status === 'recibido') ||
                    (commerce && !['entregado', 'cancelado'].includes(o.status))) && (
                    <button
                      onClick={() => ask(o, 'cancelado')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-xs font-semibold transition-all"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Transición */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl glass-andino border border-[#FF6B1A]/40 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setPending(null)}
              className="absolute top-5 right-5 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-white font-display mb-2">
              {pending.status === 'entregado'
                ? 'Confirmar Retiro y Pago'
                : pending.status === 'cancelado'
                ? 'Cancelar este Pedido'
                : STATUS_LABEL[pending.status]}
            </h3>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              {pending.status === 'cancelado'
                ? 'Se cancelará el pedido. Esta acción no se puede deshacer.'
                : pending.status === 'entregado'
                ? `Verifica el cobro presencial de ${money(pending.order.total)} y solicita el código al cliente.`
                : 'Confirma el cambio de estado para que el cliente sea notificado.'}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void confirm();
              }}
              className="space-y-4"
            >
              {pending.status === 'entregado' && (
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Código de Retiro del Cliente
                  </label>
                  <input
                    autoFocus
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. RET-8492"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
                  />
                </div>
              )}

              {failure && <p className="text-xs text-red-400">{failure}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPending(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs btn-primary-andino"
                >
                  {busy ? 'Guardando…' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
