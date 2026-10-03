'use client';

import React from 'react';
import { Sparkles, Building, Layers, ShieldCheck } from 'lucide-react';
import { ChakanaIcon } from './ChakanaIcon';

export function CulturalSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A8B5C]/20 border border-[#7A8B5C]/40 text-xs font-bold uppercase tracking-wider text-[#7A8B5C] mb-3">
            <ChakanaIcon size={14} className="text-[#7A8B5C]" />
            Diseño Arquitectónico
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
            ARQUITECTURA & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A24C] to-[#7A8B5C]">VANGUARDIA</span>
          </h2>
          <p className="text-white/60 text-base mt-3 font-sans">
            Torre Paseo Aranjuez combina tecnología lumínica de última generación con elementos naturales y líneas geométricas en cada nivel.
          </p>
        </div>

        {/* 3 Pilares Arquitectónicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Muro de Sal */}
          <div className="p-8 rounded-3xl glass-andino border border-[#D4A24C]/25 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D4A24C]/20 border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C] mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white font-display mb-2">
                Muro de Sal Natural
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Bloques de sal cristalina extraídos del Salar de Uyuni que purifican el ambiente y otorgan un microclima de serenidad térmica en las áreas de descanso.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#D4A24C]">
              <span>Purificación Natural</span>
            </div>
          </div>

          {/* Fachada Lumínica LED */}
          <div className="p-8 rounded-3xl glass-andino border-2 border-[#FF6B1A]/40 shadow-xl shadow-[#FF6B1A]/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 led-effect" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 flex items-center justify-center text-[#FF6B1A] mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white font-display mb-2">
                Fachada Dinámica Lumínica
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Sistema LED inteligente programable que reacciona a eventos, celebraciones y transiciones horarias, convirtiendo la torre en un punto de referencia urbano.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#FF6B1A]">
              <span>Iluminación Inteligente</span>
            </div>
          </div>

          {/* Geometría Escalonada */}
          <div className="p-8 rounded-3xl glass-andino border border-[#7A8B5C]/25 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#7A8B5C]/20 border border-[#7A8B5C]/40 flex items-center justify-center text-[#7A8B5C] mb-6">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white font-display mb-2">
                Geometría Escalonada
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Líneas puras, vanos simétricos y portales angulares diseñados para optimizar la ventilación natural y la entrada de luz diurna en todos los niveles comerciales.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#7A8B5C]">
              <span>Diseño Bioclimático</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
