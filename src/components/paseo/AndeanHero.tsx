'use client';

import React from 'react';
import { JarvisOrb } from './JarvisOrb';
import { ArrowRight, ShoppingBag, Sparkles, MapPin, QrCode, Award, Compass, Clock } from 'lucide-react';

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
    <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A]">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-[#B84D0B]/20 via-[#FF6B1A]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Mensaje Central */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Ubicación Oficial */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061734]/90 border border-[#D4A24C]/40 text-xs font-semibold uppercase tracking-wider text-white shadow-lg mb-6 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span>Cochabamba, Bolivia</span>
              <span className="text-white/40">•</span>
              <span className="text-[#D4A24C]">Av. América E-0834</span>
            </div>

            {/* Gran Título Display */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
              PASEO{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B1A] via-[#D4A24C] to-[#B84D0B]">
                ARANJUEZ.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-2xl font-sans mb-8 leading-relaxed">
              El centro comercial, gastronómico y empresarial de referencia en Cochabamba: compra y retira sin filas con <strong className="text-[#FF6B1A]">PaseoYa</strong>, acumula beneficios exclusivos con <strong className="text-[#D4A24C]">Paseo Points</strong> y consulta recomendaciones en vivo con <strong className="text-[#FF8F4D]">Jarvis IA</strong>.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
              <button
                onClick={onExploreMarketplace}
                className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-xl shadow-[#B84D0B]/35 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Explorar Tiendas (PaseoYa)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenPoints}
                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-semibold text-base bg-[#061734] hover:bg-white/10 text-white border border-white/20 hover:border-[#D4A24C]/60 transition-all w-full sm:w-auto"
              >
                <Award className="w-5 h-5 text-[#D4A24C]" />
                <span>Paseo Points VIP</span>
              </button>
            </div>

            {/* Métricas Reales del Mall */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 w-full max-w-lg">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono">47+</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Locales y Marcas</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#FF6B1A] font-mono">4</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Niveles Comerciales</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#D4A24C] font-mono">2</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Torres Corporativas</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Visual Interactiva con Jarvis */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md p-7 rounded-3xl bg-gradient-to-b from-[#08152B] to-[#040C1E] border border-white/15 shadow-2xl shadow-black/80 overflow-hidden">
              
              {/* Luz sutil superior */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C]" />

              {/* Encabezado de la Tarjeta */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">Centro Comercial Abierto</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span>09:00 - 23:00</span>
                </div>
              </div>

              {/* Orbe Jarvis Centrado */}
              <div className="flex flex-col items-center my-4">
                <JarvisOrb onClick={onOpenJarvis} size="md" />
                <h3 className="text-lg font-bold text-white mt-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4A24C]" />
                  Jarvis · Concierge Paseo Aranjuez
                </h3>
                <p className="text-xs text-white/60 text-center max-w-xs mt-1">
                  Encuentra restaurantes en El Cuarto, promociones de tiendas o ayuda con tu pedido Click & Collect.
                </p>
              </div>

              {/* Acciones Rápidas */}
              <div className="space-y-2.5 mt-6 pt-5 border-t border-white/10">
                <button
                  onClick={onOpenQr}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Mi QR Paseo Points (Caja & Retiro)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#mapa"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#D4A24C]" />
                    <span>Mapa de Niveles & Afluencia</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
