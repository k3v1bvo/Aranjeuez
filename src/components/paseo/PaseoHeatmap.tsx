'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, Layers, MapPin, Users, Clock, Compass, 
  TrendingUp, Eye, Sparkles, Navigation, X, Store, CheckCircle 
} from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export type FloorId = 'subsuelo' | 'piso-1' | 'piso-2' | 'piso-3';

interface Hotspot {
  id: string;
  name: string;
  category: string;
  localNum: string;
  x: number; // percentage
  y: number; // percentage
  intensity: number; // 0 to 1
  visitors: number;
  status: 'Alta' | 'Media' | 'Baja';
}

const FLOOR_DATA: Record<FloorId, { name: string; subtitle: string; totalVisitors: number; hotspots: Hotspot[] }> = {
  'piso-1': {
    name: 'Piso 1 · Nivel Comercial & Café',
    subtitle: 'Acceso Principal, Joyerías, Tecnología y Plaza Central',
    totalVisitors: 840,
    hotspots: [
      { id: 'h1-1', name: 'Café Aranjuez & Pastelería', category: 'Gastronomía', localNum: 'Local 118', x: 28, y: 35, intensity: 0.92, visitors: 115, status: 'Alta' },
      { id: 'h1-2', name: 'Plaza Central & Fuentes', category: 'Espacio Cultural', localNum: 'Área Central', x: 50, y: 50, intensity: 0.98, visitors: 260, status: 'Alta' },
      { id: 'h1-3', name: 'Tech Store Bolivia', category: 'Tecnología', localNum: 'Local 104', x: 75, y: 30, intensity: 0.65, visitors: 78, status: 'Media' },
      { id: 'h1-4', name: 'Joyería Altamira', category: 'Lujo', localNum: 'Local 112', x: 80, y: 70, intensity: 0.45, visitors: 42, status: 'Baja' },
      { id: 'h1-5', name: 'Escaleras Mecánicas Norte', category: 'Tránsito', localNum: 'Acceso Elevadores', x: 20, y: 75, intensity: 0.85, visitors: 140, status: 'Alta' },
    ],
  },
  'piso-2': {
    name: 'Piso 2 · Moda, Estética & Arte',
    subtitle: 'Boutiques de Autor, Galería Cultural y Servicios',
    totalVisitors: 620,
    hotspots: [
      { id: 'h2-1', name: 'Moda Élite & Accesorios', category: 'Moda', localNum: 'Local 204', x: 30, y: 30, intensity: 0.88, visitors: 110, status: 'Alta' },
      { id: 'h2-2', name: 'Galería de Arte Contemporáneo', category: 'Cultura', localNum: 'Mezzanina 2', x: 52, y: 45, intensity: 0.70, visitors: 85, status: 'Media' },
      { id: 'h2-3', name: 'Mundo Regalo & Souvenirs', category: 'Regalos', localNum: 'Local 211', x: 70, y: 65, intensity: 0.62, visitors: 70, status: 'Media' },
      { id: 'h2-4', name: 'Barbería Real & Spa', category: 'Estética', localNum: 'Local 216', x: 25, y: 70, intensity: 0.55, visitors: 50, status: 'Media' },
      { id: 'h2-5', name: 'Corredor Escultórico', category: 'Tránsito', localNum: 'Ala Sur', x: 82, y: 30, intensity: 0.38, visitors: 35, status: 'Baja' },
    ],
  },
  'piso-3': {
    name: 'Piso 3 · Terraza Gastronómica',
    subtitle: 'Alta Cocina, Parrillas a la Leña y Vista Panorámica',
    totalVisitors: 980,
    hotspots: [
      { id: 'h3-1', name: 'Terraza Grill & Beer', category: 'Parrilla', localNum: 'Local 302', x: 35, y: 40, intensity: 0.99, visitors: 310, status: 'Alta' },
      { id: 'h3-2', name: 'Mirador Panorámico Aranjuez', category: 'Turismo', localNum: 'Balcón Este', x: 75, y: 25, intensity: 0.94, visitors: 220, status: 'Alta' },
      { id: 'h3-3', name: 'Bar Huari Cenas de Origen', category: 'Coctelería', localNum: 'Local 308', x: 65, y: 70, intensity: 0.82, visitors: 165, status: 'Alta' },
      { id: 'h3-4', name: 'Pastelería & Helados Artesanales', category: 'Postres', localNum: 'Isla 3', x: 22, y: 70, intensity: 0.60, visitors: 90, status: 'Media' },
    ],
  },
  'subsuelo': {
    name: 'Subsuelo 1 & 2 · Parqueos & Pick-up',
    subtitle: 'Estacionamiento Inteligente, Zona de Carga y Click & Collect',
    totalVisitors: 450,
    hotspots: [
      { id: 'hs-1', name: 'Zona Click & Collect PaseoYa', category: 'Retiro Exprés', localNum: 'Bahía A-1', x: 45, y: 40, intensity: 0.88, visitors: 95, status: 'Alta' },
      { id: 'hs-2', name: 'Estacionamiento Nivel VIP Plata/Oro', category: 'Parqueo', localNum: 'Sector S1-C', x: 70, y: 60, intensity: 0.75, visitors: 140, status: 'Media' },
      { id: 'hs-3', name: 'Boletería & Cajas Automáticas', category: 'Servicio', localNum: 'Lobby Elevador', x: 25, y: 45, intensity: 0.65, visitors: 70, status: 'Media' },
      { id: 'hs-4', name: 'Estación de Carga Vehículos', category: 'Eco', localNum: 'Sector Verde', x: 80, y: 25, intensity: 0.40, visitors: 25, status: 'Baja' },
    ],
  },
};

export function PaseoHeatmap() {
  const [activeFloor, setActiveFloor] = useState<FloorId>('piso-3');
  const [viewMode, setViewMode] = useState<'heatmap' | 'directory'>('heatmap');
  const [timeOfDay, setTimeOfDay] = useState<'mediodia' | 'tarde' | 'noche'>('noche');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const currentData = FLOOR_DATA[activeFloor];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative overflow-hidden border-t border-white/10">
      {/* Resplandor térmico de fondo */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B1A]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84D0B]/20 to-[#D4A24C]/20 border border-[#FF6B1A]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-3">
                <Flame className="w-4 h-4 text-[#FF6B1A]" />
                <span>Analítica Espacial & Tránsito en Vivo</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
                MAPA INTERACTIVO & <span className="text-[#FF6B1A]">AFLUENCIA</span>
              </h2>
              <p className="text-white/60 text-base max-w-xl mt-2 font-sans">
                Monitoreo en tiempo real de concurrencia y flujo peatonal por niveles en Paseo Aranjuez. Ubica locales, zonas de alta demanda y accesos rápidos.
              </p>
            </div>

            {/* Selector de Modo: Mapa Térmico vs Directorio */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#061734] border border-white/15">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Mapa de Calor</span>
              </button>
              <button
                onClick={() => setViewMode('directory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'directory'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Directorio de Locales</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Barra de Filtros: Selección de Nivel y Horario */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#061734]/80 border border-white/10 mb-8 backdrop-blur-md">
          {/* Tabs de Pisos */}
          <div className="flex flex-wrap items-center gap-2">
            {(['subsuelo', 'piso-1', 'piso-2', 'piso-3'] as FloorId[]).map((fId) => {
              const fInfo = FLOOR_DATA[fId];
              const isActive = activeFloor === fId;
              return (
                <button
                  key={fId}
                  onClick={() => {
                    setActiveFloor(fId);
                    setSelectedHotspot(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4A24C] to-[#FF8F4D] text-[#030B1A] font-extrabold shadow-md'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{fId === 'subsuelo' ? 'Subsuelo' : fId.toUpperCase().replace('-', ' ')}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-[#030B1A]/20 text-[#030B1A]' : 'bg-white/10 text-white/50'}`}>
                    {fInfo.hotspots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selector de Horario */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Clock className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span className="hidden sm:inline font-medium">Horario simulado:</span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setTimeOfDay('mediodia')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  timeOfDay === 'mediodia' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                13:00
              </button>
              <button
                onClick={() => setTimeOfDay('tarde')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  timeOfDay === 'tarde' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                17:30
              </button>
              <button
                onClick={() => setTimeOfDay('noche')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  timeOfDay === 'noche' ? 'bg-[#FF6B1A] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                20:30 (Pico)
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor Principal: Visualización del Plano y Tarjeta de Detalle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Área del Plano Arquitectónico / Mapa */}
          <div className="lg:col-span-8 bg-[#061734] border border-white/15 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
            
            {/* Cabecera del Nivel Actual */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  <span>{currentData.name}</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">{currentData.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#FF8F4D] tracking-widest block">
                  Afluencia Estimada
                </span>
                <span className="text-lg font-mono font-black text-white tabular-nums">
                  {timeOfDay === 'noche' 
                    ? currentData.totalVisitors 
                    : timeOfDay === 'tarde' 
                    ? Math.round(currentData.totalVisitors * 0.75) 
                    : Math.round(currentData.totalVisitors * 0.55)} personas
                </span>
              </div>
            </div>

            {/* Canvas / Plano SVG Interactivo */}
            <div className="relative w-full aspect-[16/10] bg-[#030B1A] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
              
              {/* Trazado arquitectónico de fondo simulado */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                {/* Geometría de pasillos y muros del mall */}
                <rect x="15%" y="15%" width="70%" height="70%" fill="none" stroke="#D4A24C" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="50%" cy="50%" r="18%" fill="none" stroke="#FF6B1A" strokeWidth="1.5" />
                <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </svg>

              {/* Indicador de Orientación */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-white/60">
                <Compass className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>NORTE: AV. AMÉRICA</span>
              </div>

              {/* Hotspots térmicos interactivos */}
              {currentData.hotspots.map((spot) => {
                const isSelected = selectedHotspot?.id === spot.id;
                const multiplier = timeOfDay === 'noche' ? 1 : timeOfDay === 'tarde' ? 0.75 : 0.55;
                const dynamicVisitors = Math.round(spot.visitors * multiplier);

                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedHotspot(spot)}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    {/* Resplandor térmico (Modo Heatmap) */}
                    {viewMode === 'heatmap' && (
                      <div
                        style={{
                          width: `${Math.max(60, spot.intensity * 120)}px`,
                          height: `${Math.max(60, spot.intensity * 120)}px`,
                          background: spot.intensity > 0.8 
                            ? 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(255,107,26,0.4) 40%, rgba(212,162,76,0.15) 70%, transparent 100%)' 
                            : spot.intensity > 0.6 
                            ? 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, rgba(212,162,76,0.35) 45%, transparent 100%)'
                            : 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(72,169,166,0.3) 50%, transparent 100%)',
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full pointer-events-none transition-all duration-500 blur-md group-hover:scale-125"
                      />
                    )}

                    {/* Pin / Botón del Marcador */}
                    <div
                      className={`relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-125 ${
                        isSelected ? 'scale-125' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-lg border-2 ${
                          isSelected
                            ? 'bg-[#FF6B1A] border-white ring-4 ring-[#FF6B1A]/40'
                            : spot.intensity > 0.8
                            ? 'bg-red-500 border-white/80'
                            : spot.intensity > 0.6
                            ? 'bg-amber-500 border-white/80'
                            : 'bg-emerald-500 border-white/80'
                        }`}
                      >
                        {spot.localNum.replace('Local ', '').slice(0, 3)}
                      </div>

                      {/* Tooltip con nombre y afluencia al hacer hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                        <div className="bg-[#061734] border border-[#FF6B1A]/50 px-3 py-1.5 rounded-xl shadow-2xl text-center">
                          <p className="text-xs font-bold text-white">{spot.name}</p>
                          <p className="text-[10px] text-[#FF8F4D] font-mono">{spot.localNum} · {dynamicVisitors} personas</p>
                        </div>
                        <div className="w-2 h-2 bg-[#061734] border-r border-b border-[#FF6B1A]/50 rotate-45 -mt-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda Térmica */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/60 gap-4">
              <span className="font-semibold text-white/80">Escala de Afluencia:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[11px]">Muy Concurrida (&gt;80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B1A]" />
                  <span className="text-[11px]">Moderada (50-80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#D4A24C]" />
                  <span className="text-[11px]">Tranquila (&lt;50%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Lateral: Detalle del Local Seleccionado & Métricas */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Card del Local Seleccionado */}
            <div className="p-6 rounded-[2rem] bg-[#061734] border border-white/15 text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block mb-2">
                Punto de Afluencia
              </span>

              {selectedHotspot ? (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-black font-display text-white">{selectedHotspot.name}</h4>
                      <p className="text-xs text-[#FF8F4D] font-bold">{selectedHotspot.localNum} · {selectedHotspot.category}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedHotspot.status === 'Alta' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : selectedHotspot.status === 'Media'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {selectedHotspot.status} Afluencia
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-semibold">Visitantes en zona</span>
                      <span className="text-xl font-mono font-black text-white tabular-nums">
                        {selectedHotspot.visitors}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-semibold">Densidad estimada</span>
                      <span className="text-xl font-mono font-black text-[#FF6B1A] tabular-nums">
                        {Math.round(selectedHotspot.intensity * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1 mb-4">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Retiro PaseoYa Click & Collect disponible.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Suma 1x punto por cada 1 Bs consumido.</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-white/50">
                  <Compass className="w-10 h-10 mx-auto stroke-[1.5] mb-2 text-white/30 animate-pulse" />
                  <p className="text-sm font-bold text-white/70">Selecciona un punto en el mapa</p>
                  <p className="text-xs mt-1">Haz clic en los marcadores del plano para ver afluencia, personas y horarios.</p>
                </div>
              )}
            </div>

            {/* Métricas Globales del Piso */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#061734] to-[#030B1A] border border-[#D4A24C]/30 text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block mb-3">
                Resumen de Tráfico Peatonal
              </span>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-white/60">Flujo General en Nivel:</span>
                  <span className="font-bold text-emerald-400">Fluido & Óptimo</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-white/60">Tiempo promedio de estadía:</span>
                  <span className="font-mono font-bold">42 minutos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Puntos de carga / Ascensores:</span>
                  <span className="font-bold text-[#FF8F4D]">Operativos 100%</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
