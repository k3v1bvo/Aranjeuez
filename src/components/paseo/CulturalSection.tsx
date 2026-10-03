'use client';

import React from 'react';
import { Utensils, ShoppingBag, Gamepad2, Building2, CheckCircle2 } from 'lucide-react';

export function CulturalSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B84D0B]/20 border border-[#FF6B1A]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Experiencia Paseo Aranjuez
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            NEGOCIOS, GASTRONOMÍA & <span className="text-[#FF6B1A]">ENTRETENIMIENTO</span>
          </h2>
          <p className="text-white/60 text-base mt-3 font-sans">
            El complejo comercial y empresarial más completo de Cochabamba, diseñado para brindarte una experiencia inolvidable en cada nivel.
          </p>
        </div>

        {/* 4 Pilares Reales del Mall */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Gastronomía & Terrazas */}
          <div className="p-7 rounded-3xl bg-[#061734] border border-white/10 hover:border-[#FF6B1A]/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/30 flex items-center justify-center text-[#FF6B1A] mb-6 group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Terrazas & Gastronomía
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Descubre <strong>El Cuarto</strong> en el Piso 4 con 8 barras de autor y coctelería premium, más la <strong>Plaza de Comidas</strong> con opciones internacionales y criollas en el Piso 3.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-[#FF8F4D]">
              <CheckCircle2 className="w-4 h-4 text-[#FF6B1A]" />
              <span>Piso 3 y Piso 4</span>
            </div>
          </div>

          {/* 2. Tiendas & Moda */}
          <div className="p-7 rounded-3xl bg-[#061734] border border-white/10 hover:border-[#D4A24C]/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D4A24C]/10 border border-[#D4A24C]/30 flex items-center justify-center text-[#D4A24C] mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Moda, Accesorios & Tech
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Tiendas oficiales como Samsung Store (LYNX), Gap, Puma, Burbank, EuroStyle, Totto, Pinkie y Manhattan con las últimas colecciones.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-[#D4A24C]">
              <CheckCircle2 className="w-4 h-4 text-[#D4A24C]" />
              <span>Planta Baja, Piso 1 y 2</span>
            </div>
          </div>

          {/* 3. Sky Games & Diversión */}
          <div className="p-7 rounded-3xl bg-[#061734] border border-white/10 hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] mb-6 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Sky Games & Diversión
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                El centro de entretenimiento tech con simuladores de velocidad, mesas de arcade interactivo, tren panorámico y atracciones mecánicas para toda la familia.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-[#38BDF8]">
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Niveles 3 y 4</span>
            </div>
          </div>

          {/* 4. Torres Corporativas */}
          <div className="p-7 rounded-3xl bg-[#061734] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Torres Corporativas
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Pisos 5 al 11 con consultorios médicos y odontológicos de prestigio, estudios jurídicos y sedes de empresas multinacionales con acceso inteligente.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Torre A & B (Pisos 5-11)</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
