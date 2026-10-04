'use client';

import { ChakanaIcon } from './ChakanaIcon';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Award,
  Shield,
  Star,
  Crown,
  Check,
  QrCode,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sparkles,
  CreditCard,
  ChevronRight,
  Zap,
  Gift,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  UserCheck,
} from 'lucide-react';
import { MOCK_REWARDS, MOCK_POINTS_HISTORY } from '@/lib/mock-data';
import { AnimatedCounter } from './AnimatedCounter';
import { ConfettiEffect } from './ConfettiEffect';
import { ScrollRevealContainer, ScrollRevealItem, ScrollReveal } from './ScrollReveal';
import { usePaseoToast } from './PaseoToast';
import { useSession } from './Providers';

interface PaseoPointsShowcaseProps {
  onOpenQr: () => void;
}

interface TierDefinition {
  name: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  sub: string;
  minPoints: number;
  maxPoints: number;
  rangeText: string;
  multiplier: string;
  accentColor: string;
  badgeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  bgGradient: string;
  borderClass: string;
  benefits: { bold: string; normal: string }[];
  description: string;
}

const TIERS: TierDefinition[] = [
  {
    name: 'Bronce',
    sub: 'Tier 1 · Inicial',
    minPoints: 0,
    maxPoints: 999,
    rangeText: '0 a 999 pts',
    multiplier: '1.0x',
    accentColor: '#A9714B',
    badgeLabel: 'Punto de Partida',
    icon: Shield,
    bgGradient: 'linear-gradient(145deg, #2A170F 0%, #150B07 60%, #361D13 100%)',
    borderClass: 'border-[#A9714B]/40 hover:border-[#A9714B]',
    benefits: [
      { bold: '1 punto acumulado', normal: 'por cada 1 Bs de consumo' },
      { bold: 'Descuentos de bienvenida', normal: 'en tiendas y cafeterías' },
      { bold: 'Acceso a ferias', normal: 'y eventos culturales del mall' },
    ],
    description:
      'Nivel de bienvenida para todos los miembros de Paseo Aranjuez. Cada consumo suma puntos para canjear en gastronomía, cine y servicios.',
  },
  {
    name: 'Plata',
    sub: 'Tier 2 · Titanio',
    minPoints: 1000,
    maxPoints: 4999,
    rangeText: '1.000 a 4.999 pts',
    multiplier: '1.2x',
    accentColor: '#C0C7D1',
    badgeLabel: '1.2x Puntos Finde',
    icon: Award,
    bgGradient: 'linear-gradient(145deg, #1E293B 0%, #0F172A 60%, #293548 100%)',
    borderClass: 'border-[#C0C7D1]/50 hover:border-[#C0C7D1]',
    benefits: [
      { bold: '1.2x Puntos extra', normal: 'en compras durante fines de semana' },
      { bold: '1 hora gratis', normal: 'de estacionamiento cubierto por visita' },
      { bold: 'Descuentos selectos', normal: 'en gastronomía y restaurantes' },
    ],
    description:
      'Nivel intermedio para clientes habituales. Otorga 1 hora de estacionamiento cubierto gratis por visita y multiplicador 1.2x en fines de semana.',
  },
  {
    name: 'Oro',
    sub: 'Tier 3 · Imperial',
    minPoints: 5000,
    maxPoints: 14999,
    rangeText: '5.000 a 14.999 pts',
    multiplier: '1.5x',
    accentColor: '#D4A24C',
    badgeLabel: 'VIP Gold',
    icon: Star,
    bgGradient: 'linear-gradient(145deg, #382405 0%, #170E02 60%, #472E06 100%)',
    borderClass: 'border-[#D4A24C]/60 hover:border-[#D4A24C]',
    benefits: [
      { bold: '1.5x Puntos permanentes', normal: 'en todo el centro comercial' },
      { bold: '4 horas libres', normal: 'de parqueo cubierto y seguro' },
      { bold: 'Mesa prioritaria', normal: 'en Terraza Grill & Beer El Cuarto' },
      { bold: 'Invitaciones exclusivas', normal: 'a catas privadas y degustaciones' },
    ],
    description:
      'Nivel preferencial de alto estándar. Incluye 4 horas libres de parqueo cubierto, mesa preferencial en Terraza Grill e invitaciones VIP a eventos Huari.',
  },
  {
    name: 'Platino',
    sub: 'Tier 4 · Elite',
    minPoints: 15000,
    maxPoints: Infinity,
    rangeText: '15.000+ pts',
    multiplier: '2.0x',
    accentColor: '#8E9AAF',
    badgeLabel: 'Supreme Black',
    icon: Crown,
    bgGradient: 'linear-gradient(145deg, #0F172A 0%, #030712 60%, #1A1838 100%)',
    borderClass: 'border-indigo-400/50 hover:border-indigo-300',
    benefits: [
      { bold: '2.0x Puntos dobles', normal: 'en todas las tiendas y servicios' },
      { bold: 'Valet parking libre', normal: 'y estacionamiento preferencial 24/7' },
      { bold: 'Mesa reservada perpetua', normal: 'en eventos de moda y música' },
      { bold: 'Asistente Jarvis VIP', normal: 'dedicado y reservas prioritarias' },
    ],
    description:
      'Máxima distinción de honor en Paseo Aranjuez. Valet parking permanente, puntos dobles 2.0x en cada compra y asistencia personal Jarvis VIP sin espera.',
  },
];

export function PaseoPointsShowcase({ onOpenQr }: PaseoPointsShowcaseProps) {
  const { showToast } = usePaseoToast();
  const { user } = useSession();

  // Sincronización limpia de puntos reales del usuario
  const [points, setPoints] = useState<number>(user?.points ?? 0);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);
  const [isConfettiActive, setIsConfettiActive] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'ganado' | 'canjeado'>('todos');
  const [selectedTierDetail, setSelectedTierDetail] = useState<TierDefinition | null>(null);

  useEffect(() => {
    if (user?.points !== undefined) {
      setPoints(user.points);
    }
  }, [user?.points]);

  const isGuest = !user;

  // Determinar el nivel real del usuario en base a sus puntos actuales
  const currentTierIndex = isGuest
    ? -1
    : points >= 15000
      ? 3
      : points >= 5000
        ? 2
        : points >= 1000
          ? 1
          : 0;

  const currentTier = currentTierIndex >= 0 ? TIERS[currentTierIndex] : null;
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < 3 ? TIERS[currentTierIndex + 1] : null;

  // Progreso hacia el siguiente nivel
  let progressToNext = 0;
  let pointsToNext = 0;
  if (!isGuest && currentTier && nextTier) {
    const range = nextTier.minPoints - currentTier.minPoints;
    const earned = points - currentTier.minPoints;
    progressToNext = Math.min(Math.max(Math.round((earned / range) * 100), 0), 100);
    pointsToNext = Math.max(nextTier.minPoints - points, 0);
  } else if (!isGuest && currentTierIndex === 3) {
    progressToNext = 100;
    pointsToNext = 0;
  }

  const filteredHistory =
    historyFilter === 'todos'
      ? MOCK_POINTS_HISTORY
      : MOCK_POINTS_HISTORY.filter((item) => item.type === historyFilter);

  const handleClaim = (rewardTitle: string, cost: number) => {
    if (isGuest) {
      showToast('Inicia sesión', 'warning', 'Debes ingresar a tu cuenta para canjear recompensas.');
      window.location.href = '/auth/login';
      return;
    }

    if (points >= cost) {
      setPoints((prev) => prev - cost);
      setClaimedReward(rewardTitle);
      setIsConfettiActive(true);
      showToast('¡Recompensa Canjeada!', 'success', `Has canjeado ${rewardTitle}.`);
      setTimeout(() => setClaimedReward(null), 4500);
    } else {
      showToast('Puntos insuficientes', 'warning', `Necesitas ${cost} puntos para este canje.`);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative overflow-hidden">
      {/* Confetti Oficial de Canje */}
      <ConfettiEffect
        active={isConfettiActive}
        onComplete={() => setIsConfettiActive(false)}
        title="¡Canje Exitoso!"
        message={`Has canjeado ${claimedReward || 'tu premio'}. El cupón QR está disponible en tu credencial.`}
      />

      {/* Resplandores decorativos ambientales */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[600px] h-[600px] bg-[#B84D0B]/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Encabezado Principal y Tarjeta VIP Hero de Saldo */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
            {/* Texto y Concepto */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84D0B]/20 to-[#D4A24C]/20 border border-[#D4A24C]/40 text-xs font-bold uppercase tracking-wider text-[#FF8F4D] mb-4 shadow-sm">
                <Flame className="w-4 h-4 text-[#FF6B1A]" />
                <span>Programa de Beneficios & Fidelización</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white font-display tracking-tight leading-[1.08]">
                PASEO <span className="text-[#D4A24C]">POINTS</span>
              </h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mt-3 font-sans leading-relaxed">
                Premia cada visita y compra en el mall. Sube de categoría, desbloquea privilegios
                exclusivos y canjea experiencias gastronómicas y de moda.
              </p>

              {/* Badges de beneficios rápidos */}
              <div className="flex flex-wrap gap-2.5 mt-6 text-xs text-white/80">
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#FF6B1A]" /> 1 Bs = 1 Punto
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#D4A24C]" /> Canjes Inmediatos
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Sin Vencimiento
                </span>
              </div>
            </div>

            {/* TARJETA DIGITAL VIP DE MEMBRESÍA (DINÁMICA POR NIVEL) */}
            <div className="lg:col-span-6">
              <div
                className="relative rounded-[2rem] p-6 sm:p-8 overflow-hidden text-white shadow-2xl border transition-all duration-500 hover:scale-[1.01]"
                style={{
                  background: isGuest
                    ? 'linear-gradient(135deg, #0A1B36 0%, #030B1A 50%, #152238 100%)'
                    : currentTier?.bgGradient || 'linear-gradient(135deg, #0A1B36 0%, #030B1A 100%)',
                  borderColor: isGuest ? 'rgba(212, 162, 76, 0.4)' : `${currentTier?.accentColor}80`,
                  boxShadow: isGuest
                    ? '0 25px 60px -15px rgba(212, 162, 76, 0.25), 0 0 40px rgba(184, 77, 11, 0.15)'
                    : `0 25px 60px -15px ${currentTier?.accentColor}40`,
                }}
              >
                {/* Línea LED Superior */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${
                      isGuest ? '#D4A24C' : currentTier?.accentColor
                    }, transparent)`,
                  }}
                />

                {/* Marca de Agua Chakana de Fondo */}
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <ChakanaIcon size={240} className="text-[#D4A24C]" />
                </div>

                {/* Fila Superior: Chip EMV, Nombre del Mall y Nivel Actual */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Chip Inteligente EMV en Oro */}
                    <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-[#FFE082] via-[#D4A24C] to-[#8D6E18] p-1 shadow-inner flex flex-col justify-between border border-white/40">
                      <div className="h-1 bg-black/30 rounded-full w-full" />
                      <div className="h-1 bg-black/30 rounded-full w-3/4" />
                      <div className="h-1 bg-black/30 rounded-full w-full" />
                    </div>
                    {/* Indicador Contactless */}
                    <div className="flex flex-col text-[10px] text-white/60 font-mono tracking-widest leading-none">
                      <span>MEMBERSHIP</span>
                      <span className="text-[#D4A24C] font-bold">PASEO ARANJUEZ</span>
                    </div>
                  </div>

                  {/* Badge de Nivel Activo */}
                  {isGuest ? (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Modo Invitado
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-lg animate-pulse"
                      style={{
                        backgroundColor: `${currentTier?.accentColor}25`,
                        borderColor: currentTier?.accentColor,
                      }}
                    >
                      {currentTier && React.createElement(currentTier.icon, { className: 'w-4 h-4' })}
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Nivel {currentTier?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fila Central: Saldo de Puntos Animado */}
                <div className="my-5 relative z-10">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#D4A24C] block mb-1">
                    {isGuest ? 'Puntos Acumulados' : `Saldo disponible de ${user?.name}`}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl sm:text-6xl font-black text-white font-display tracking-tight tabular-nums drop-shadow-md">
                      <AnimatedCounter value={isGuest ? 0 : points} duration={1600} />
                    </div>
                    <span className="text-lg font-black text-[#FF8F4D] uppercase font-mono tracking-wider">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Contenedor de Progreso Dinámico */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6 relative z-10">
                  {isGuest ? (
                    <div className="text-xs text-white/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/40 flex items-center justify-center shrink-0 text-[#D4A24C]">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <p className="leading-snug">
                        Inicia sesión para acumular puntos en cada compra y desbloquear beneficios
                        de estacionamiento y gastronomía.
                      </p>
                    </div>
                  ) : nextTier ? (
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-white/80 font-semibold">
                          Progreso hacia <strong className="text-[#D4A24C]">Nivel {nextTier.name}</strong>
                        </span>
                        <span className="font-mono font-bold text-[#FF8F4D] tabular-nums">
                          Faltan {pointsToNext.toLocaleString()} pts
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C] transition-all duration-1000 ease-out"
                          style={{ width: `${progressToNext}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-white/50 mt-1.5 tabular-nums font-mono">
                        <span>
                          {currentTier?.name} ({currentTier?.minPoints.toLocaleString()})
                        </span>
                        <span className="text-[#D4A24C] font-bold">
                          {points.toLocaleString()} pts ({progressToNext}%)
                        </span>
                        <span>
                          {nextTier.name} ({nextTier.minPoints.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-white/90">
                      <Crown className="w-5 h-5 text-amber-300 shrink-0" />
                      <div>
                        <strong className="text-amber-300 block">¡Máximo Estatus Supreme Alcanzado!</strong>
                        <span>Disfrutas de multiplicador 2.0x, valet parking permanente y atención VIP Jarvis.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fila Inferior: Botones de Acción */}
                <div className="flex items-center gap-3 relative z-10">
                  {isGuest ? (
                    <button
                      onClick={() => (window.location.href = '/auth/login')}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C] text-white font-bold text-xs uppercase tracking-wider btn-primary-andino flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/30 border border-white/20"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión / Activar Membresía</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onOpenQr}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs uppercase tracking-wider btn-primary-andino flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/30 border border-white/20"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Mostrar Credencial QR</span>
                      </button>

                      <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-2 border border-white/15 hover:border-white/30"
                      >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Historial</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Notificación de Recompensa Canjeada */}
        {claimedReward && (
          <div className="mb-12 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 flex items-center justify-between text-white animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-white">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">¡Cupón Generado con Éxito!</h4>
                <p className="text-xs text-white/80">
                  Has canjeado &quot;{claimedReward}&quot;. El cupón QR está listo en tu credencial.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenQr}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-100 transition-all"
            >
              Ver Cupón
            </button>
          </div>
        )}

        {/* SECCIÓN DE LOS 4 NIVELES DE FIDELIDAD (DINÁMICA Y RESPONSIVA) */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D4A24C] block mb-2">
              Jerarquía de Beneficios
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              Los 4 Niveles de Paseo Aranjuez
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Cada nivel desbloquea multiplicadores de puntos, beneficios de estacionamiento y
              accesos exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier, idx) => {
              const Icon = tier.icon;
              const isCurrent = !isGuest && currentTierIndex === idx;
              const isPassed = !isGuest && currentTierIndex > idx;
              const isLocked = !isGuest && currentTierIndex < idx;

              return (
                <div
                  key={tier.name}
                  onClick={() => setSelectedTierDetail(tier)}
                  className={`rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group shadow-lg ${
                    isCurrent
                      ? 'border-2 shadow-2xl scale-[1.02]'
                      : isPassed
                        ? 'border border-emerald-500/30'
                        : tier.borderClass
                  }`}
                  style={{
                    background: tier.bgGradient,
                    borderColor: isCurrent ? tier.accentColor : undefined,
                    boxShadow: isCurrent
                      ? `0 16px 36px -8px ${tier.accentColor}50`
                      : undefined,
                  }}
                >
                  {/* Badge Superior Flotante */}
                  {isCurrent && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Tu Nivel Actual</span>
                    </div>
                  )}

                  {isPassed && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Completado</span>
                    </div>
                  )}

                  {isGuest && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-[10px] font-bold uppercase tracking-wider">
                      <span>{tier.badgeLabel}</span>
                    </div>
                  )}

                  {isLocked && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado</span>
                    </div>
                  )}

                  {/* Brillo ambiental */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl transition-all group-hover:opacity-40 opacity-20 pointer-events-none"
                    style={{ backgroundColor: tier.accentColor }}
                  />

                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl p-0.5 shadow-md flex items-center justify-center border border-white/20"
                        style={{
                          backgroundColor: `${tier.accentColor}25`,
                          color: tier.accentColor,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <span
                        className="text-[10px] uppercase font-bold tracking-widest block"
                        style={{ color: tier.accentColor }}
                      >
                        {tier.sub}
                      </span>
                      <h4 className="text-2xl font-black text-white font-display">{tier.name}</h4>
                      <p className="text-xs text-white/50 font-mono mt-0.5 tabular-nums">
                        {tier.rangeText}
                      </p>
                    </div>

                    {/* Mini Barra de Progreso en la tarjeta activa */}
                    {isCurrent && nextTier && (
                      <div className="bg-black/40 rounded-xl p-2.5 mb-3 border border-white/10">
                        <div className="flex justify-between text-[11px] font-semibold text-white/90 mb-1">
                          <span>Estado actual</span>
                          <span className="font-mono text-[#D4A24C]">{points.toLocaleString()} pts</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#FF6B1A] to-[#D4A24C] h-full transition-all duration-700"
                            style={{ width: `${progressToNext}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Beneficios */}
                    <ul className="space-y-2 text-xs text-white/80 border-t border-white/10 pt-4">
                      {tier.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: tier.accentColor }}
                          />
                          <span>
                            <strong className="text-white">{b.bold}</strong> {b.normal}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer de Tarjeta */}
                  <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                    {isPassed ? (
                      <span className="text-emerald-400">Nivel Superado</span>
                    ) : isCurrent ? (
                      <span className="text-[#FF8F4D] font-bold">Tu membresía activa</span>
                    ) : isLocked ? (
                      <span className="text-white/50">
                        Faltan {(tier.minPoints - points).toLocaleString()} pts
                      </span>
                    ) : (
                      <span className="text-[#D4A24C]">Ver Beneficios</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CATÁLOGO DE RECOMPENSAS CANJEABLES */}
        <div className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D4A24C] block mb-2">
              Catálogo Exclusivo
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              Canjea tus Puntos
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Selecciona experiencias gastronómicas, entradas de cine y beneficios exclusivos.
            </p>
          </div>

          <ScrollRevealContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_REWARDS.map((reward) => (
              <ScrollRevealItem key={reward.id}>
                <div className="p-6 rounded-3xl bg-[#061734]/80 border border-white/10 hover:border-[#D4A24C]/40 transition-all flex flex-col justify-between group shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        {reward.category}
                      </span>
                      <span className="text-xs text-[#D4A24C] font-semibold">{reward.store}</span>
                    </div>

                    <h4 className="text-lg font-black text-white font-display mb-1 group-hover:text-[#D4A24C] transition-colors">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed mb-4">
                      {reward.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase font-semibold">
                        Costo
                      </span>
                      <span className="text-lg font-black text-[#D4A24C] font-mono tabular-nums">
                        {reward.pointsCost} pts
                      </span>
                    </div>

                    <button
                      onClick={() => handleClaim(reward.title, reward.pointsCost)}
                      disabled={!isGuest && points < reward.pointsCost}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        isGuest
                          ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino'
                          : points >= reward.pointsCost
                            ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {isGuest ? 'Ingresar y Canjear' : points >= reward.pointsCost ? 'Canjear' : 'Faltan pts'}
                    </button>
                  </div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealContainer>
        </div>
      </div>

      {/* Modal Detalle de Nivel al hacer Click */}
      {selectedTierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedTierDetail(null)}
            className="fixed inset-0 bg-[#030B1A]/85 backdrop-blur-md animate-in fade-in duration-200"
          />
          <div className="relative w-full max-w-md rounded-3xl bg-[#061734] border border-[#D4A24C]/40 p-6 sm:p-7 text-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, #D4A24C, ${selectedTierDetail.accentColor}, #FF6B1A)`,
              }}
            />
            <button
              onClick={() => setSelectedTierDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div
                className="w-13 h-13 rounded-2xl p-3 border border-white/20 flex items-center justify-center shadow-md"
                style={{
                  backgroundColor: `${selectedTierDetail.accentColor}25`,
                  color: selectedTierDetail.accentColor,
                }}
              >
                {React.createElement(selectedTierDetail.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
                  {selectedTierDetail.sub}
                </span>
                <h3 className="text-2xl font-black font-display">Nivel {selectedTierDetail.name}</h3>
                <span className="text-xs text-white/60 font-mono">{selectedTierDetail.rangeText}</span>
              </div>
            </div>

            <p className="text-xs text-white/80 mb-5 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10">
              {selectedTierDetail.description}
            </p>

            <div className="space-y-2 mb-6">
              <h5 className="text-[11px] uppercase font-bold tracking-wider text-white/50 mb-2">
                Privilegios del Nivel
              </h5>
              {selectedTierDetail.benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-white/90">
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: selectedTierDetail.accentColor }}
                  />
                  <span>
                    <strong>{b.bold}</strong> {b.normal}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedTierDetail(null);
                if (user) {
                  onOpenQr();
                } else {
                  window.location.href = '/auth/login';
                }
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs uppercase tracking-wider btn-primary-andino flex items-center justify-center gap-2"
            >
              {user ? (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Ver mi credencial QR</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión para activar este nivel</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Historial de Puntos */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsHistoryModalOpen(false)}
            className="fixed inset-0 bg-[#030B1A]/80 backdrop-blur-md animate-in fade-in duration-200"
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-[#061734] border border-[#D4A24C]/40 p-6 text-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#D4A24C]" />
                <h3 className="font-black text-lg font-display">Historial de Puntos</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-4">
              {(['todos', 'ganado', 'canjeado'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    historyFilter === filter
                      ? 'bg-[#D4A24C] text-black shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Lista de Movimientos */}
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === 'ganado'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.type === 'ganado' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.storeName}</p>
                      <p className="text-[11px] text-white/50">{item.description}</p>
                      <span className="text-[10px] text-white/40">{item.date}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-black text-sm tabular-nums ${
                      item.type === 'ganado' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
