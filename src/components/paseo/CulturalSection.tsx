'use client';

import React from 'react';
import { Layers, Sparkles, Building, Eye, Compass, CheckCircle2 } from 'lucide-react';
import { ChakanaIcon } from './ChakanaIcon';

export function CulturalSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A8B5C]/20 border border-[#7A8B5C]/40 text-xs font-bold uppercase tracking-wider text-[#7A8B5C] mb-3">
            <ChakanaIcon size={14} className="text-[#7A8B5C]" />
            Diseño & Espacios Exclusivos
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
            ARQUITECTURA & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A24C] to-[#7A8B5C]">VANGUARDIA</span>
          </h2>
          <p className="text-white/60 text-base mt-3 font-sans">
            Torre Paseo Aranjuez combina tecnología lumínica de última generación con amplias terrazas panorámicas y diseño contemporáneo en cada nivel.
          </p>
        </div>

        {/* 3 Pilares Arquitectónicos con estilo glass-andino */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Terraza El Cuarto & Gastronomía */}
          <div className="p-8 rounded-3xl glass-andino border border-[#D4A24C]/25 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D4A24C]/20 border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C] mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white font-display mb-2">
                Terrazas 360° en El Cuarto
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Ubicada en el 4to piso, la terraza gastronómica integra 8 barras gourmet de autor y coctelería premium con vistas panorámicas inigualables a la cordillera.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#D4A24C]">
              <span>Piso 4 · Vista Panorámica</span>
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
                Fachada Lumínica LED
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Sistema inteligente con más de 20,000 nodos LED dinámicos que iluminan la icónica avenida América con secuencias visuales y arte digital.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#FF6B1A]">
              <span>Iluminación Arquitectónica</span>
            </div>
          </div>

          {/* Torres Corporativas Inteligentes */}
          <div className="p-8 rounded-3xl glass-andino border border-[#7A8B5C]/25 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#7A8B5C]/20 border border-[#7A8B5C]/40 flex items-center justify-center text-[#7A8B5C] mb-6">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white font-display mb-2">
                Torres Corporativas
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">
                Pisos 5 al 11 con consultorios médicos especializados, estudios jurídicos y sedes de agencias multinacionales con ascensores inteligentes.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#7A8B5C]">
              <span>Torres A & B (Pisos 5-11)</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
