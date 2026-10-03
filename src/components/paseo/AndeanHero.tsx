'use client';

import React from 'react';
import { JarvisOrb } from './JarvisOrb';
import { ArrowRight, ShoppingBag, Sparkles, MapPin, Zap } from 'lucide-react';
import { ChakanaIcon } from './ChakanaIcon';

interface AndeanHeroProps {
  onExploreMarketplace: () => void;
  onOpenJarvis: () => void;
  onOpenPoints: () => void;
  onOpenQr: () => void;
}

export function AndeanHero({
  onExploreMarketplace,
  onOpenJarvis,
  onOpenPoints,
  onOpenQr,
}: AndeanHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-pattern-andino">
      {/* Resplandor ambiental superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-[#B84D0B]/20 via-[#FF6B1A]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Mensaje Central */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Badge de Ubicación con Chakana */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061734]/90 border border-[#D4A24C]/40 text-xs font-semibold uppercase tracking-wider text-white shadow-lg mb-6 backdrop-blur-md">
              <ChakanaIcon size={14} className="text-[#FF6B1A]" />
              <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Cochabamba</span>
              <span className="text-white/40">·</span>
              <span className="text-[#D4A24C]">Av. América & Pando</span>
            </div>

            {/* Gran Título Display */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6 font-display">
              PASEO{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B1A] via-[#D4A24C] to-[#B84D0B]">
                ARANJUEZ.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/75 max-w-2xl font-sans mb-8 leading-relaxed">
              El centro comercial, gastronómico y corporativo más vanguardista de la ciudad en una sola plataforma: retiro ágil con <strong className="text-[#FF6B1A]">PaseoYa</strong>, asistencia inteligente con <strong className="text-[#D4A24C]">Jarvis</strong> y beneficios exclusivos en cada visita con <strong className="text-[#FF8F4D]">Paseo Points</strong>.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
              <button
                onClick={onExploreMarketplace}
                className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-xl shadow-[#B84D0B]/35 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Explorar PaseoYa</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenQr}
                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base glass-andino hover:bg-white/10 text-white transition-all w-full sm:w-auto border border-white/20"
              >
                <Sparkles className="w-5 h-5 text-[#D4A24C]" />
                <span>Mi Credencial QR</span>
              </button>
            </div>

            {/* Métricas con tabular-nums */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 w-full max-w-lg">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-display tabular-nums">47+</span>
                <span className="text-xs text-white/50 block font-sans mt-0.5">Locales en Mall</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#FF6B1A] font-display tabular-nums">100%</span>
                <span className="text-xs text-white/50 block font-sans mt-0.5">Retiro en Local</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#D4A24C] font-display tabular-nums">1 Bs = 1 Pt</span>
                <span className="text-xs text-white/50 block font-sans mt-0.5">Paseo Points</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Jarvis */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md p-6 rounded-3xl glass-andino border border-[#FF6B1A]/20 shadow-2xl flex flex-col items-center text-center">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061734] border border-[#FF6B1A]/40 text-xs font-bold text-[#FF6B1A] mb-2 uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-[#FF6B1A]" />
                Asistente Virtual
              </div>

              <h3 className="text-xl font-black text-white font-display mb-1">
                Jarvis Paseo
              </h3>
              <p className="text-xs text-white/60 mb-6">
                Interactúa con el orbe o consulta horarios, tiendas y ubicaciones
              </p>

              {/* Orbe Interactivo con Partículas */}
              <JarvisOrb size="md" showControls={true} onClick={onOpenJarvis} />

              <button
                onClick={onOpenJarvis}
                className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <span>Consultar a Jarvis</span>
                <ArrowRight className="w-4 h-4 text-[#D4A24C]" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
