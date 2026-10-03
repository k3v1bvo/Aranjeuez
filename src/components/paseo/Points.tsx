'use client';

import React, { useRef, useState } from 'react';
import {
  Gift,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  QrCode,
  Flame,
  Award,
  CheckCircle,
  Clock,
  History,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Movement, Redemption, Reward, User } from '@/lib/paseo/model';
import { dateTime, levelFor } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { Empty, ErrorState, Loading } from './UI';
import { Code } from './Code';
import { ChakanaIcon } from './ChakanaIcon';
import { QrPulsanteModal } from './QrPulsanteModal';

interface PointsData {
  user: User;
  movements: Movement[];
  rewards: Reward[];
  redemptions: Redemption[];
  settings: { points_ratio: number };
}

export function Points() {
  const { data, loading, error, reload } = useResource<PointsData>('puntos', 15000);
  const { refresh } = useSession();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [coupon, setCoupon] = useState<Redemption | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const key = useRef('');

  async function redeem() {
    if (!selected) return;
    setBusy(true);
    setFailure('');
    try {
      const result = await api<{ redemption: Redemption }>('puntos', {
        method: 'POST',
        body: JSON.stringify({ rewardId: selected.id, requestKey: key.current }),
      });
      setSelected(null);
      setCoupon(result.redemption);
      reload();
      void refresh();
      toast.success('¡Beneficio canjeado con éxito!');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos canjear el beneficio.');
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="py-24 text-center">
        <Loading label="Cargando tus Paseo Points…" />
      </div>
    );

  if (!data)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto">
        <ErrorState message={error || 'No se pudo cargar el programa de puntos'} retry={reload} />
      </div>
    );

  const level = levelFor(data.user.lifetime_points);
  const valid = (c: Redemption) => c.status === 'activo';

  const pts = data.user.points || 0;
  const lifetime = data.user.lifetime_points || pts;
  const currentTier =
    lifetime >= 15000 ? 'Platino' : lifetime >= 5000 ? 'Oro' : lifetime >= 1000 ? 'Plata' : 'Bronce';

  const nextTierPoints =
    currentTier === 'Bronce' ? 1000 : currentTier === 'Plata' ? 5000 : currentTier === 'Oro' ? 15000 : 15000;
  const ptsNeeded = Math.max(0, nextTierPoints - lifetime);
  const progressPercent = Math.min(100, Math.round((lifetime / nextTierPoints) * 100));

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner Luxury */}
      <div className="text-center mb-12">
        <span className="text-xs uppercase font-bold text-[#FF8F4D] tracking-widest block mb-2 flex items-center justify-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#FF6B1A]" />
          Programa de Beneficios & Fidelización
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-display text-white tracking-tight">
          Paseo Points VIP
        </h1>
        <p className="text-white/60 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
          Premia cada visita y compra en el mall. Sube de categoría, desbloquea privilegios exclusivos y canjea experiencias gastronómicas y de moda.
        </p>
      </div>

      {/* Tarjeta de Membresía Digital con Chakana Dorada */}
      <div className="mb-14 rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-[#061734] via-[#091E42] to-[#030B1A] border-2 border-[#D4A24C]/40 shadow-2xl">
        {/* Marca de agua Chakana dorada */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 opacity-15 pointer-events-none text-[#D4A24C]">
          <ChakanaIcon size={320} rotateOnHover={false} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/50 text-xs font-bold text-[#D4A24C] uppercase tracking-wider">
                Membresía Paseo Aranjuez
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/80">
                Nivel {currentTier}
              </span>
            </div>

            <h2 className="text-sm uppercase font-semibold text-white/60 tracking-wider">
              Saldo de {data.user.name}
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight tabular-nums">
                {pts.toLocaleString('es-BO')}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#D4A24C] font-display">PTS</span>
            </div>

            {/* Barra de Progreso a Siguiente Nivel */}
            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-xs font-semibold text-white/70 mb-2">
                <span>Progreso hacia Nivel {currentTier === 'Bronce' ? 'Plata' : currentTier === 'Plata' ? 'Oro' : 'Platino'}</span>
                <span className="text-[#D4A24C]">
                  {ptsNeeded > 0 ? `Faltan ${ptsNeeded.toLocaleString('es-BO')} pts` : '¡Nivel Máximo!'}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] transition-all duration-500 shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/40 mt-1">
                <span>{currentTier} ({lifetime.toLocaleString('es-BO')} pts históricos)</span>
                <span>{progressPercent}% completado</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm shadow-xl shadow-[#FF6B1A]/25 btn-primary-andino flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Mostrar Credencial QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Los 4 Niveles de Fidelidad */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
            Jerarquía de Beneficios
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
            Los 4 Niveles de Paseo Aranjuez
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              tier: 'Bronce',
              range: '0 a 999 pts',
              color: 'border-white/10',
              accent: 'text-amber-600',
              perks: ['Gana 1 pt por cada Bs. 1', 'Descuentos de bienvenida en locales', 'Acceso a eventos del mall'],
            },
            {
              tier: 'Plata',
              range: '1.000 a 4.999 pts',
              color: 'border-slate-300/40',
              accent: 'text-slate-300',
              perks: ['1.2x Puntos fines de semana', '1 hora gratis de parqueo cubierto', 'Promos 2x1 en cine y café'],
            },
            {
              tier: 'Oro',
              range: '5.000 a 14.999 pts',
              color: 'border-[#D4A24C]/50',
              accent: 'text-[#D4A24C]',
              perks: ['1.5x Puntos en todo el mall', '4 horas libres de estacionamiento', 'Mesa prioritaria en El Cuarto', 'Catas privadas de café y vinos'],
            },
            {
              tier: 'Platino',
              range: '15.000+ pts',
              color: 'border-cyan-400/50',
              accent: 'text-cyan-300',
              perks: ['2.0x Puntos dobles permanentes', 'Valet parking y parqueo libre', 'Mesa reservada perpetua', 'Asistente Jarvis VIP dedicado'],
            },
          ].map((item) => {
            const isUserTier = currentTier === item.tier;
            return (
              <div
                key={item.tier}
                className={`rounded-3xl p-6 glass-andino border ${item.color} ${
                  isUserTier ? 'ring-2 ring-[#FF6B1A] shadow-xl shadow-[#FF6B1A]/20' : ''
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xl font-black font-display ${item.accent}`}>{item.tier}</span>
                    {isUserTier && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B1A] text-white text-[10px] font-black uppercase">
                        Tu Nivel
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/60 block mb-4 font-mono">{item.range}</span>
                  <ul className="space-y-2 text-xs text-white/80">
                    {item.perks.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#FF6B1A] flex-shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catálogo de Beneficios / Recompensas para Canjear */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
              Catálogo Exclusivo
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              Canjea tus Paseo Points
            </h3>
          </div>
          <Gift className="w-7 h-7 text-[#FF6B1A]" />
        </div>

        {data.rewards.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.rewards
              .filter((r) => !r.store || r.store.is_active)
              .map((r) => {
                const canAfford = data.user.points >= r.points_cost;
                return (
                  <div
                    key={r.id}
                    className="rounded-3xl glass-andino border border-white/10 p-6 flex flex-col justify-between card-hover-reward h-full shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-[#D4A24C]">
                          {r.store?.name || 'Club Paseo'}
                        </span>
                        <span className="text-xs text-white/50">
                          {r.stock === -1 ? 'Ilimitado' : `${r.stock} disp.`}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1.5">{r.name}</h4>
                      <p className="text-xs text-white/60 line-clamp-3 leading-relaxed mb-4">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-white/40 uppercase font-semibold block">Costo</span>
                        <span className="text-xl font-black text-[#D4A24C] font-mono tabular-nums">
                          {r.points_cost} pts
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          key.current = crypto.randomUUID();
                          setFailure('');
                          setSelected(r);
                        }}
                        disabled={!canAfford || r.stock === 0}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          canAfford && r.stock !== 0
                            ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino'
                            : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {r.stock === 0
                          ? 'Agotado'
                          : canAfford
                          ? 'Canjear'
                          : `Faltan ${r.points_cost - data.user.points} pts`}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <Empty
            title="Pronto habrá más beneficios"
            detail="Administración está actualizando las recompensas activas del mall."
          />
        )}
      </div>

      {/* Cupones Canjeados y Movimientos de Puntos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mis Cupones */}
        <div className="rounded-3xl glass-andino border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[#FF6B1A]" />
            <h3 className="text-xl font-bold text-white font-display">Mis Cupones Canjeados</h3>
          </div>
          <p className="text-xs text-white/60 mb-6">
            Presenta tu cupón digital en caja del local correspondiente para hacerlo válido.
          </p>

          {data.redemptions.length ? (
            <div className="space-y-3">
              {data.redemptions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                >
                  <div>
                    <h5 className="font-bold text-sm text-white">{c.reward?.name || 'Recompensa'}</h5>
                    <span className="text-[11px] text-white/50 block mt-0.5">
                      {dateTime(c.created_at)} ·{' '}
                      <span className={valid(c) ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                        {valid(c) ? 'Disponible para uso' : c.status === 'usado' ? 'Utilizado' : 'Expirado'}
                      </span>
                    </span>
                  </div>
                  {valid(c) && (
                    <button
                      onClick={() => setCoupon(c)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15"
                    >
                      Ver Código
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/40 py-6 text-center">
              Aún no has canjeado cupones. Elige una recompensa del catálogo para comenzar.
            </div>
          )}
        </div>

        {/* Historial de Movimientos */}
        <div className="rounded-3xl glass-andino border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-[#D4A24C]" />
            <h3 className="text-xl font-bold text-white font-display">Historial de Puntos</h3>
          </div>
          <p className="text-xs text-white/60 mb-6">
            Registro de compras acumuladas y canjes de recompensas en Paseo Aranjuez.
          </p>

          {data.movements.length ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {data.movements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{m.reason}</span>
                    <span className="text-[10px] text-white/50">{dateTime(m.created_at)}</span>
                  </div>
                  <span
                    className={`font-black font-mono text-sm ${
                      m.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {m.amount > 0 ? `+${m.amount}` : m.amount} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/40 py-6 text-center">
              Aún no registras movimientos de puntos. ¡Tus compras en PaseoYa sumarán puntos automáticamente!
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Canje */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl glass-andino border border-[#FF6B1A]/40 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-white font-display mb-2">Confirmar Canje</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Usarás <strong className="text-[#D4A24C]">{selected.points_cost} Paseo Points</strong> para obtener{' '}
              <strong className="text-white">{selected.name}</strong>. El cupón vence en 30 días y se utiliza en caja.
            </p>
            {failure && <p className="text-xs text-red-400 mb-4">{failure}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={redeem}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs btn-primary-andino"
              >
                {busy ? 'Canjeando…' : 'Confirmar Canje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cupón con QR */}
      {coupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl glass-andino border border-[#D4A24C]/40 p-6 sm:p-8 shadow-2xl relative text-center">
            <button
              onClick={() => setCoupon(null)}
              className="absolute top-5 right-5 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
              Cupón Válido
            </span>
            <h3 className="text-2xl font-bold text-white font-display mb-4">
              {coupon.reward?.name || 'Tu Beneficio'}
            </h3>
            <div className="flex justify-center my-4">
              <Code
                type="coupon"
                token={coupon.qr_token}
                manual={coupon.coupon_code}
                label="Muestra este QR en el local"
              />
            </div>
            <button
              onClick={() => setCoupon(null)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs mt-4"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Modal QR Credencial */}
      <QrPulsanteModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        userName={data.user.name}
        points={data.user.points}
        level={currentTier as 'Bronce' | 'Plata' | 'Oro' | 'Platino'}
        pinCode={'4829'}
        qrToken={data.user.qr_token || 'demo_token'}
      />
    </div>
  );
}
