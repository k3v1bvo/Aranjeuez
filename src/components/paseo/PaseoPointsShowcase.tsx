'use client';

import React, { useState } from 'react';
import { 
  Flame, Award, Shield, Star, Crown, Check, QrCode, 
  History, ArrowUpRight, ArrowDownLeft, X, Sparkles, 
  CreditCard, ChevronRight, Zap, Gift, CheckCircle2, Clock
} from 'lucide-react';
import { MOCK_USER, MOCK_REWARDS, MOCK_POINTS_HISTORY, PointsHistoryItem } from '@/lib/mock-data';
import { AnimatedCounter } from './AnimatedCounter';
import { ConfettiEffect } from './ConfettiEffect';
import { ScrollRevealContainer, ScrollRevealItem, ScrollReveal } from './ScrollReveal';
import { usePaseoToast } from './PaseoToast';


interface PaseoPointsShowcaseProps {
  onOpenQr: () => void;
}

export function PaseoPointsShowcase({ onOpenQr }: PaseoPointsShowcaseProps) {
  const { showToast } = usePaseoToast();
  const [points, setPoints] = useState<number>(MOCK_USER.points);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);
  const [isConfettiActive, setIsConfettiActive] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'ganado' | 'canjeado'>('todos');
  const [selectedTierDetail, setSelectedTierDetail] = useState<'Bronce' | 'Plata' | 'Oro' | 'Platino' | null>(null);

  const filteredHistory = historyFilter === 'todos'
    ? MOCK_POINTS_HISTORY
    : MOCK_POINTS_HISTORY.filter(item => item.type === historyFilter);

  const handleClaim = (rewardTitle: string, cost: number) => {
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

  // Cálculo de progreso de Mateo: de 1.000 (Plata) a 5.000 (Oro) -> rango 4.000 pts
  // Actualmente tiene 1.450 -> 450 / 4000 = 11.25% dentro del nivel Plata, o 1450/5000 = 29% total
  const progressToGold = Math.min(Math.round(((points - 1000) / (MOCK_USER.nextLevelPoints - 1000)) * 100), 100);
  const pointsRemaining = Math.max(MOCK_USER.nextLevelPoints - points, 0);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative overflow-hidden">
      {/* Confetti Oficial con Partículas y Check Animado (Regla 7) */}
      <ConfettiEffect
        active={isConfettiActive}
        onComplete={() => setIsConfettiActive(false)}
        title="¡Canje Exitoso!"
        message={`Has canjeado ${claimedReward || 'tu premio'}. El cupón QR está disponible en tu credencial.`}
      />

      {/* Resplandor decorativo ambiental */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[600px] h-[600px] bg-[#B84D0B]/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Encabezado Principal y Tarjeta VIP Hero de Saldo */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
            
            {/* Texto y Concepto */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84D0B]/20 to-[#D4A24C]/20 border border-[#D4A24C]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-4">
                <Flame className="w-4 h-4 text-[#FF6B1A]" />
                <span>Programa de Beneficios & Fidelización</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white font-display tracking-tight leading-[1.08]">
                PASEO <span className="text-[#D4A24C]">POINTS</span>
              </h2>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mt-3 font-sans leading-relaxed">
                Premia cada visita y compra en el mall. Sube de categoría, desbloquea privilegios exclusivos y canjea experiencias gastronómicas y de moda.
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

            {/* Tarjeta Digital VIP de Membresía (Estilo Apple Wallet / Black Card Luxury) */}
            <div className="lg:col-span-6">
              <div 
                className="relative rounded-[2rem] p-6 sm:p-8 overflow-hidden text-white shadow-2xl border border-white/20 transition-all duration-500 hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, #0A1B36 0%, #030B1A 50%, #152238 100%)',
                  boxShadow: '0 25px 60px -15px rgba(212, 162, 76, 0.25), 0 0 40px rgba(184, 77, 11, 0.2)',
                }}
              >
                {/* Línea LED Superior */}
                <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />

                {/* Marca de Agua Chakana de Fondo */}
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <Crown size={240} className="text-[#D4A24C]" />
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
                    {/* Onda Contactless */}
                    <div className="hidden sm:flex flex-col text-[10px] text-white/50 font-mono tracking-widest leading-none">
                      <span>MEMBERSHIP</span>
                      <span className="text-[#D4A24C] font-bold">PASEO ARANJUEZ</span>
                    </div>
                  </div>

                  {/* Badge de Nivel Activo */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C0C7D1]/20 to-[#D4A24C]/20 border border-[#D4A24C] shadow-lg shadow-[#D4A24C]/15">
                    <Award className="w-4 h-4 text-[#D4A24C]" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Nivel {MOCK_USER.level}
                    </span>
                  </div>
                </div>

                {/* Fila Central: Saldo de Puntos Animado */}
                <div className="my-5 relative z-10">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#D4A24C] block mb-1">
                    Saldo de {MOCK_USER.name}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl sm:text-6xl font-black text-white font-display tracking-tight tabular-nums drop-shadow-md">
                      <AnimatedCounter value={points} duration={1800} />
                    </div>
                    <span className="text-lg font-black text-[#FF8F4D] uppercase font-mono tracking-wider">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso hacia el siguiente nivel (Oro) */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 mb-6 relative z-10">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-white/70 font-semibold">
                      Progreso hacia <strong className="text-[#D4A24C]">Nivel Oro</strong>
                    </span>
                    <span className="font-mono font-bold text-[#FF8F4D] tabular-nums">
                      Faltan {pointsRemaining.toLocaleString()} pts
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C] transition-all duration-1000 ease-out"
                      style={{ width: `${progressToGold}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/50 mt-1.5 tabular-nums">
                    <span>Plata (1.000)</span>
                    <span className="text-[#D4A24C] font-bold">{points.toLocaleString()} pts actuales ({progressToGold}%)</span>
                    <span>Oro (5.000)</span>
                  </div>
                </div>

                {/* Fila Inferior: Botones de Acción */}
                <div className="flex items-center gap-3 relative z-10">
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
                    title="Ver historial de puntos"
                  >
                    <History className="w-4 h-4 text-[#D4A24C]" />
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>

        {/* Notificación de Canje Exitoso */}
        {claimedReward && (
          <div className="mb-10 p-4 rounded-2xl bg-gradient-to-r from-[#22C55E]/20 to-[#D4A24C]/20 border border-[#22C55E]/50 text-white flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-black font-bold">
                <Check className="w-5 h-5 text-black" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Canje confirmado</h4>
                <p className="text-xs text-white/80">Has canjeado "{claimedReward}". El cupón QR está listo en tu credencial.</p>
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

        {/* SECCIÓN DE LOS 4 NIVELES DE FIDELIDAD CON DISEÑO DE TARJETAS METÁLICAS */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D4A24C] block mb-2">
              Jerarquía de Beneficios
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              Los 4 Niveles de Paseo Aranjuez
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Cada nivel desbloquea multiplicadores de puntos, beneficios de estacionamiento y accesos exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* TARJETA 1: BRONCE */}
            <div 
              onClick={() => setSelectedTierDetail('Bronce')}
              className="rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 border border-[#A9714B]/40 hover:border-[#A9714B] shadow-lg relative overflow-hidden group"
              style={{
                background: 'linear-gradient(145deg, #2D1B14 0%, #170E0A 60%, #382015 100%)',
              }}
            >
              {/* Brillo ambiental */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#A9714B]/20 rounded-full blur-2xl group-hover:bg-[#A9714B]/35 transition-all" />

              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A9714B] to-[#5C3317] p-0.5 shadow-md flex items-center justify-center text-white">
                    <Shield className="w-6 h-6 text-[#FFD1B3]" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Completado
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#A9714B]">
                    Tier 1 · Inicial
                  </span>
                  <h4 className="text-2xl font-black text-white font-display">
                    Bronce
                  </h4>
                  <p className="text-xs text-white/50 font-mono mt-0.5 tabular-nums">
                    0 a 999 pts
                  </p>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-white/80 border-t border-white/10 pt-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A9714B] shrink-0 mt-0.5" />
                    <span>Acumula 1 punto por cada 1 Bs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A9714B] shrink-0 mt-0.5" />
                    <span>Descuentos de bienvenida en locales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A9714B] shrink-0 mt-0.5" />
                    <span>Acceso a ferias y eventos del mall</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold text-emerald-400">Nivel Superado</span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* TARJETA 2: PLATA (NIVEL ACTUAL DE MATEO) */}
            <div 
              onClick={() => setSelectedTierDetail('Plata')}
              className="rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 border-2 border-[#C0C7D1] shadow-2xl relative overflow-hidden group"
              style={{
                background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 60%, #334155 100%)',
                boxShadow: '0 16px 36px -8px rgba(192, 199, 209, 0.35)',
              }}
            >
              {/* Badge Flotante "NIVEL ACTUAL" */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>Nivel Actual</span>
              </div>

              {/* Brillo de Titanio */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#C0C7D1]/25 rounded-full blur-2xl group-hover:bg-[#C0C7D1]/40 transition-all" />

              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#C0C7D1] to-[#64748B] p-0.5 shadow-md flex items-center justify-center text-black">
                    <Award className="w-6 h-6 text-slate-800" />
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C0C7D1]">
                    Tier 2 · Titanio
                  </span>
                  <h4 className="text-2xl font-black text-white font-display">
                    Plata
                  </h4>
                  <p className="text-xs text-white/50 font-mono mt-0.5 tabular-nums">
                    1.000 a 4.999 pts
                  </p>
                </div>

                {/* Mini Progreso */}
                <div className="bg-black/30 rounded-xl p-2.5 mb-3 border border-white/10">
                  <div className="flex justify-between text-[11px] font-semibold text-white/90 mb-1">
                    <span>Estado actual</span>
                    <span className="font-mono text-[#D4A24C]">{points.toLocaleString()} pts</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FF6B1A] to-[#D4A24C] h-full" style={{ width: `${progressToGold}%` }} />
                  </div>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-white/90 border-t border-white/10 pt-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C0C7D1] shrink-0 mt-0.5" />
                    <span><strong>1.2x Puntos</strong> en fines de semana</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C0C7D1] shrink-0 mt-0.5" />
                    <span><strong>1 hora gratis</strong> de estacionamiento cubierto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C0C7D1] shrink-0 mt-0.5" />
                    <span>Descuentos selectos en gastronomía</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#FF8F4D] font-bold">
                <span>Tu membresía activa</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* TARJETA 3: ORO */}
            <div 
              onClick={() => setSelectedTierDetail('Oro')}
              className="rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 border-2 border-[#D4A24C]/80 hover:border-[#D4A24C] shadow-2xl relative overflow-hidden group"
              style={{
                background: 'linear-gradient(145deg, #3D2606 0%, #1A1002 60%, #4D3208 100%)',
                boxShadow: '0 16px 36px -8px rgba(212, 162, 76, 0.35)',
              }}
            >
              {/* Badge VIP */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4A24C] to-[#FFE082] text-black text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-black" />
                <span>VIP Gold</span>
              </div>

              {/* Brillo Dorado */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D4A24C]/25 rounded-full blur-2xl group-hover:bg-[#D4A24C]/45 transition-all" />

              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE082] via-[#D4A24C] to-[#8D6E18] p-0.5 shadow-md flex items-center justify-center text-black">
                    <Star className="w-6 h-6 text-amber-950 fill-amber-950" />
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C]">
                    Tier 3 · Imperial
                  </span>
                  <h4 className="text-2xl font-black text-white font-display">
                    Oro
                  </h4>
                  <p className="text-xs text-white/50 font-mono mt-0.5 tabular-nums">
                    5.000 a 14.999 pts
                  </p>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-white/90 border-t border-white/10 pt-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4A24C] shrink-0 mt-0.5" />
                    <span><strong>1.5x Puntos</strong> en todo el centro comercial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4A24C] shrink-0 mt-0.5" />
                    <span><strong>4 horas libres</strong> de parqueo cubierto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4A24C] shrink-0 mt-0.5" />
                    <span>Mesa prioritaria en Terraza Grill & Beer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4A24C] shrink-0 mt-0.5" />
                    <span>Invitaciones exclusivas a catas privadas</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#D4A24C] font-semibold">
                <span>Faltan {pointsRemaining.toLocaleString()} pts</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* TARJETA 4: PLATINO */}
            <div 
              onClick={() => setSelectedTierDetail('Platino')}
              className="rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 border-2 border-[#8E9AAF]/60 hover:border-white shadow-2xl relative overflow-hidden group"
              style={{
                background: 'linear-gradient(145deg, #0F172A 0%, #030712 60%, #1E1B4B 100%)',
                boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.25)',
              }}
            >
              {/* Badge Black Supreme */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-slate-200 via-indigo-200 to-white text-black text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Crown className="w-3 h-3 text-indigo-900 fill-indigo-900" />
                <span>Supreme</span>
              </div>

              {/* Brillo Holográfico */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/40 transition-all" />

              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white via-[#8E9AAF] to-slate-900 p-0.5 shadow-md flex items-center justify-center text-white">
                    <Crown className="w-6 h-6 text-amber-300" />
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8E9AAF]">
                    Tier 4 · Elite
                  </span>
                  <h4 className="text-2xl font-black text-white font-display">
                    Platino
                  </h4>
                  <p className="text-xs text-white/50 font-mono mt-0.5 tabular-nums">
                    15.000+ pts
                  </p>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-white/90 border-t border-white/10 pt-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>2.0x Puntos dobles</strong> permanentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Valet parking</strong> y estacionamiento libre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Mesa reservada perpetua en eventos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Asistente Jarvis VIP dedicado sin espera</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Máximo Estatus</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>

        {/* Catálogo de Recompensas con ScrollRevealContainer (Regla 1) y Card Hover Reward (Regla 2) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
                Catálogo Exclusivo
              </span>
              <h3 className="text-3xl font-black text-white font-display">
                Canjea Tus Paseo Points
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Elige entre café de especialidad, vales de compra, parqueo cubierto y estética VIP.
              </p>
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs font-bold text-[#D4A24C] hover:text-white px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#D4A24C]/30 flex items-center gap-2 self-start sm:self-auto transition-all"
            >
              <History className="w-4 h-4 text-[#D4A24C]" />
              <span>Ver Historial de Movimientos</span>
            </button>
          </div>

          <ScrollRevealContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_REWARDS.map((reward) => (
              <ScrollRevealItem key={reward.id}>
                <div
                  className="group rounded-3xl glass-andino card-hover-reward border border-white/10 overflow-hidden flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-black/40">
                      <img
                        src={reward.image}
                        alt={reward.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        {reward.category}
                      </div>
                    </div>

                    <div className="p-5">
                      <h4 className="text-base font-bold text-white group-hover:text-[#FF6B1A] transition-colors leading-snug">
                        {reward.title}
                      </h4>
                      <p className="text-xs text-white/50 mt-1">
                        {reward.store}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase font-semibold">Costo</span>
                      <span className="text-lg font-black text-[#D4A24C] font-mono tabular-nums">
                        {reward.pointsCost} pts
                      </span>
                    </div>

                    <button
                      onClick={() => handleClaim(reward.title, reward.pointsCost)}
                      disabled={points < reward.pointsCost}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        points >= reward.pointsCost
                          ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {points >= reward.pointsCost ? 'Canjear' : 'Faltan pts'}
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
            <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />
            <button
              onClick={() => setSelectedTierDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-[#D4A24C]/20 border border-[#D4A24C]/40 text-[#D4A24C]">
                {selectedTierDetail === 'Bronce' && <Shield className="w-6 h-6" />}
                {selectedTierDetail === 'Plata' && <Award className="w-6 h-6" />}
                {selectedTierDetail === 'Oro' && <Star className="w-6 h-6" />}
                {selectedTierDetail === 'Platino' && <Crown className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C]">Detalles de Membresía</span>
                <h3 className="text-2xl font-black font-display">Nivel {selectedTierDetail}</h3>
              </div>
            </div>

            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              {selectedTierDetail === 'Bronce' && 'Nivel de entrada para todos los visitantes de Paseo Aranjuez. Cada consumo suma puntos para canjear en gastronomía y servicios.'}
              {selectedTierDetail === 'Plata' && 'Nivel actual de Mateo Quiroga. Otorga 1 hora de estacionamiento cubierto gratis por visita y multiplicador 1.2x en fines de semana.'}
              {selectedTierDetail === 'Oro' && 'Nivel preferencial para clientes frecuentes. Incluye 4 horas libres de parqueo cubierto, mesa preferencial en Terraza Grill e invitaciones VIP a eventos Huari.'}
              {selectedTierDetail === 'Platino' && 'Máxima distinción de honor en Paseo Aranjuez. Valet parking permanente, puntos dobles 2.0x en cada compra y asistencia personal Jarvis VIP.'}
            </p>

            <button
              onClick={() => {
                setSelectedTierDetail(null);
                onOpenQr();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs uppercase tracking-wider btn-primary-andino flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver mi credencial QR</span>
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
                    <div className={`p-2 rounded-lg ${
                      item.type === 'ganado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
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
                  <span className={`font-mono font-black text-sm tabular-nums ${
                    item.type === 'ganado' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
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
