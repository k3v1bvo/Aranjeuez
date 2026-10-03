'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, Layers, MapPin, Users, Clock, Compass, 
  TrendingUp, Eye, Sparkles, Navigation, X, Store, CheckCircle,
  ShoppingBag, ArrowRight
} from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export type FloorId = 'pb' | 'piso-1' | 'piso-2' | 'piso-3' | 'piso-4' | 'torres';

interface Hotspot {
  id: string;
  storeId?: string;
  name: string;
  category: string;
  localNum: string;
  x: number; // percentage 10 to 90
  y: number; // percentage 15 to 85
  intensity: number; // 0 to 1
  visitors: number;
  status: 'Alta' | 'Media' | 'Baja';
  schedule?: string;
  description?: string;
}

// Fallback base data with real tenants from Paseo Aranjuez
const INITIAL_FLOORS: Record<FloorId, { name: string; subtitle: string; totalVisitors: number; defaultHotspots: Hotspot[] }> = {
  'pb': {
    name: 'Planta Baja — Lobby Principal & Tecnología',
    subtitle: 'Acceso Av. América, LYNX Samsung Store, Burbank, Gap, Perfumería Cosbelle',
    totalVisitors: 1420,
    defaultHotspots: [
      { id: 'pb-1', name: 'Samsung Store (LYNX)', category: 'tecnologia', localNum: 'Local L9', x: 22, y: 35, intensity: 0.95, visitors: 340, status: 'Alta', schedule: '10:00 - 21:00', description: 'Smartphones Galaxy, smartwatches y punto tecnológico de entrada.' },
      { id: 'pb-2', name: 'Burbank Bolivia', category: 'moda', localNum: 'Local #104', x: 45, y: 30, intensity: 0.88, visitors: 210, status: 'Alta', schedule: '10:00 - 21:00', description: 'Ropa urbana inspirada en la cultura boliviana.' },
      { id: 'pb-3', name: 'Cinnabon', category: 'gastronomia', localNum: 'Local PB-09', x: 18, y: 70, intensity: 0.92, visitors: 280, status: 'Alta', schedule: '09:00 - 21:30', description: 'Rollos de canela calientes y frappés de paso al ingreso.' },
      { id: 'pb-4', name: 'Perfumería Cosbelle', category: 'salud', localNum: 'Local PB-03', x: 65, y: 35, intensity: 0.74, visitors: 165, status: 'Media', schedule: '10:00 - 21:00', description: 'Perfumes originales de diseñador y cosmética exclusiva.' },
      { id: 'pb-5', name: 'Ópticas Pauker', category: 'salud', localNum: 'Local PB-04', x: 78, y: 40, intensity: 0.65, visitors: 110, status: 'Media', schedule: '09:30 - 20:30', description: 'Boutique de lentes de sol y salud visual.' },
      { id: 'pb-6', name: 'Farmacorp + Amarket', category: 'salud', localNum: 'Local PB-05', x: 82, y: 72, intensity: 0.85, visitors: 230, status: 'Alta', schedule: '08:00 - 22:00', description: 'Farmacia 24/7 y micromercado express.' },
      { id: 'pb-7', name: 'La Galería Cultural', category: 'entretenimiento', localNum: 'Local PB-Art', x: 50, y: 65, intensity: 0.80, visitors: 195, status: 'Alta', schedule: '09:00 - 22:00', description: 'Muro de arte central y exposiciones culturales.' },
    ],
  },
  'piso-1': {
    name: 'Primer Piso — Moda Femenina & Sastrería',
    subtitle: 'EuroStyle, Manhattan, Pinkie, Blush Beauty Station, Textilón',
    totalVisitors: 1180,
    defaultHotspots: [
      { id: 'p1-1', name: 'Pinkie', category: 'moda', localNum: 'Local #103', x: 25, y: 35, intensity: 0.91, visitors: 260, status: 'Alta', schedule: '10:00 - 21:00', description: 'Ropa urbana y juvenil para mujeres.' },
      { id: 'p1-2', name: 'Manhattan', category: 'moda', localNum: 'Local #114', x: 42, y: 30, intensity: 0.82, visitors: 190, status: 'Alta', schedule: '10:00 - 20:30', description: 'Camisas finas y ropa de vestir formal masculina.' },
      { id: 'p1-3', name: 'EuroStyle (Springfield / Women secret)', category: 'moda', localNum: 'Local 110', x: 72, y: 35, intensity: 0.94, visitors: 310, status: 'Alta', schedule: '10:00 - 21:00', description: 'Gran local renovado con marcas europeas.' },
      { id: 'p1-4', name: 'Ohanna Accesorios', category: 'accesorios', localNum: 'Local BELU', x: 20, y: 70, intensity: 0.70, visitors: 145, status: 'Media', schedule: '10:00 - 21:00', description: 'Joyas de acero inoxidable lado ascensor sud.' },
      { id: 'p1-5', name: 'Blush Beauty Station', category: 'salud', localNum: 'Local 107', x: 58, y: 65, intensity: 0.78, visitors: 175, status: 'Media', schedule: '10:00 - 20:30', description: 'Estación de maquillaje profesional y skincare.' },
      { id: 'p1-6', name: 'Hermassi Sastrería', category: 'moda', localNum: 'Local 122', x: 80, y: 70, intensity: 0.60, visitors: 95, status: 'Baja', schedule: '09:30 - 20:00', description: 'Trajes de alta sastrería a medida.' },
    ],
  },
  'piso-2': {
    name: 'Segundo Piso — Deportes, Niños y Hogar',
    subtitle: 'Totto, Top Collection, Gool Store, Cat Lifestyle, Hauscenter',
    totalVisitors: 940,
    defaultHotspots: [
      { id: 'p2-1', name: 'Totto', category: 'accesorios', localNum: 'Local #203', x: 28, y: 35, intensity: 0.89, visitors: 240, status: 'Alta', schedule: '10:00 - 21:00', description: 'Mochilas universitarias y maletas de viaje.' },
      { id: 'p2-2', name: 'Top Collection', category: 'moda', localNum: 'Local #212', x: 48, y: 30, intensity: 0.72, visitors: 160, status: 'Media', schedule: '10:00 - 20:30', description: 'Chamarras pesadas y moda de temporada.' },
      { id: 'p2-3', name: 'Gool Store', category: 'moda', localNum: 'Local 208', x: 75, y: 35, intensity: 0.85, visitors: 220, status: 'Alta', schedule: '10:00 - 21:00', description: 'Zapatillas deportivas y fútbol multimarca.' },
      { id: 'p2-4', name: 'Cat Lifestyle Bolivia', category: 'moda', localNum: 'Local 215', x: 30, y: 70, intensity: 0.76, visitors: 170, status: 'Media', schedule: '10:00 - 20:30', description: 'Botas Caterpillar y calzado outdoor.' },
      { id: 'p2-5', name: 'Hauscenter / Home Select', category: 'hogar', localNum: 'Local 220', x: 70, y: 65, intensity: 0.65, visitors: 130, status: 'Media', schedule: '10:00 - 21:00', description: 'Decoración y artículos de diseño para el hogar.' },
    ],
  },
  'piso-3': {
    name: 'Tercer Piso — Mercado Gastronómico & Juegos',
    subtitle: 'Plaza de comidas, DeliStanbul, Brocheta King, Sky Games Arcade',
    totalVisitors: 1680,
    defaultHotspots: [
      { id: 'p3-1', name: 'DeliStanbul', category: 'gastronomia', localNum: 'Local 301', x: 22, y: 35, intensity: 0.98, visitors: 380, status: 'Alta', schedule: '11:30 - 22:30', description: 'Shawarmas gigantes y auténtica comida turca.' },
      { id: 'p3-2', name: 'La Sanguchería (Patio)', category: 'gastronomia', localNum: 'Local 302', x: 45, y: 30, intensity: 0.92, visitors: 310, status: 'Alta', schedule: '11:30 - 22:30', description: 'Hamburguesas artesanales y sándwiches rápidos.' },
      { id: 'p3-3', name: 'El Guajojo Rellenos', category: 'gastronomia', localNum: 'Local 303', x: 68, y: 32, intensity: 0.88, visitors: 270, status: 'Alta', schedule: '11:00 - 21:30', description: 'Rellenos tradicionales crujientes con ají.' },
      { id: 'p3-4', name: 'Sky Games (Arcade)', category: 'entretenimiento', localNum: 'Local 306', x: 80, y: 68, intensity: 0.96, visitors: 390, status: 'Alta', schedule: '11:00 - 22:00', description: 'Simuladores de carreras y mesas de hockey.' },
      { id: 'p3-5', name: 'Cowork Estudiantil', category: 'servicios', localNum: 'Local 307', x: 28, y: 72, intensity: 0.78, visitors: 180, status: 'Media', schedule: '08:30 - 22:00', description: 'Conexiones eléctricas y wifi para estudio.' },
    ],
  },
  'piso-4': {
    name: 'Cuarto Piso — Terrazas Gourmet & Coctelería',
    subtitle: 'El Cuarto (8 Barras), Patanegra, Brocheta King, Botánica Infusiones',
    totalVisitors: 1530,
    defaultHotspots: [
      { id: 'p4-1', name: 'El Cuarto (Terraza)', category: 'gastronomia', localNum: 'Local 401', x: 30, y: 35, intensity: 0.99, visitors: 420, status: 'Alta', schedule: '17:00 - 02:00', description: '8 barras gourmet, coctelería y vista nocturna.' },
      { id: 'p4-2', name: 'Patanegra Taberna Española', category: 'gastronomia', localNum: 'Local 402', x: 62, y: 30, intensity: 0.93, visitors: 310, status: 'Alta', schedule: '12:00 - 00:00', description: 'Jamón ibérico, tapas y cañas frías.' },
      { id: 'p4-3', name: 'Brocheta King', category: 'gastronomia', localNum: 'Local 403', x: 78, y: 55, intensity: 0.91, visitors: 290, status: 'Alta', schedule: '17:30 - 01:00', description: 'Anticuchos tiernos al carbón y chorizos parrilleros.' },
      { id: 'p4-4', name: 'Botánica Infusiones & Café', category: 'gastronomia', localNum: 'Local 405', x: 25, y: 70, intensity: 0.85, visitors: 250, status: 'Alta', schedule: '10:00 - 22:00', description: 'Café de especialidad y tés finos en pérgola.' },
      { id: 'p4-5', name: 'Sky Games (Mecánicos)', category: 'entretenimiento', localNum: 'Local 406', x: 60, y: 75, intensity: 0.82, visitors: 230, status: 'Alta', schedule: '12:00 - 22:00', description: 'Atracciones mecánicas infantiles y tren panorámico.' },
    ],
  },
  'torres': {
    name: 'Torres Corporativas — Pisos 5 al 11',
    subtitle: 'Consultorios Médicos, Despachos Jurídicos, Agencias de Software & Marketing',
    totalVisitors: 720,
    defaultHotspots: [
      { id: 'tor-1', name: 'Consultorios Médicos & Odontología', category: 'salud', localNum: 'Oficina 504', x: 35, y: 40, intensity: 0.75, visitors: 160, status: 'Media', schedule: '08:30 - 19:30', description: 'Torre A Piso 5: Odontología y consultas especializadas.' },
      { id: 'tor-2', name: 'Despachos Jurídicos & Notaría', category: 'servicios', localNum: 'Oficina 702', x: 65, y: 45, intensity: 0.68, visitors: 140, status: 'Media', schedule: '09:00 - 18:30', description: 'Torre B Piso 7: Asesoría corporativa y notaría pública.' },
      { id: 'tor-3', name: 'Hub de Innovación & Software', category: 'tecnologia', localNum: 'Oficina 901', x: 50, y: 70, intensity: 0.82, visitors: 210, status: 'Alta', schedule: '08:30 - 20:00', description: 'Torre A Piso 9: Desarrollo tecnológico y marketing multinacional.' },
    ],
  },
};

export function PaseoHeatmap() {
  const [activeFloor, setActiveFloor] = useState<FloorId>('piso-3');
  const [viewMode, setViewMode] = useState<'heatmap' | 'directory'>('heatmap');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [liveStores, setLiveStores] = useState<any[]>([]);

  // Cargar tiendas reales del backend si están disponibles
  useEffect(() => {
    fetch('/api/paseo/catalogo')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.stores) && data.stores.length > 0) {
          setLiveStores(data.stores);
        }
      })
      .catch(() => {});
  }, []);

  const floorInfo = INITIAL_FLOORS[activeFloor];

  // Integrar tiendas del catálogo dinámicamente según el piso
  const floorStores = liveStores.filter((s) => {
    const fl = (s.floor || '').toLowerCase();
    if (activeFloor === 'pb') return fl.includes('baja') || fl.includes('pb');
    if (activeFloor === 'piso-1') return fl.includes('1') || fl.includes('primer');
    if (activeFloor === 'piso-2') return fl.includes('2') || fl.includes('segundo');
    if (activeFloor === 'piso-3') return fl.includes('3') || fl.includes('tercer');
    if (activeFloor === 'piso-4') return fl.includes('4') || fl.includes('cuarto');
    if (activeFloor === 'torres') return fl.includes('torre') || fl.includes('5') || fl.includes('7') || fl.includes('9');
    return false;
  });

  return (
    <section id="mapa" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative overflow-hidden border-t border-white/10">
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
                <span>Analítica Espacial, Locales & Afluencia en Vivo</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                MAPA INTERACTIVO & <span className="text-[#FF6B1A]">AFLUENCIA</span>
              </h2>
              <p className="text-white/60 text-base max-w-xl mt-2">
                Monitoreo en tiempo real del Paseo Aranjuez por niveles. Ubicación automática del número de local en cada recogida de pedido y escaneo QR.
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
                <span>Directorio ({liveStores.length || 47} Locales)</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Barra de Filtros: Selección de Nivel */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#061734]/80 border border-white/10 mb-8 backdrop-blur-md">
          {/* Tabs de Pisos */}
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'pb', label: 'Planta Baja' },
              { id: 'piso-1', label: 'Piso 1 (Moda)' },
              { id: 'piso-2', label: 'Piso 2 (Hogar/Deportes)' },
              { id: 'piso-3', label: 'Piso 3 (Comidas)' },
              { id: 'piso-4', label: 'Piso 4 (Terrazas)' },
              { id: 'torres', label: 'Torres (5-11)' }
            ] as { id: FloorId; label: string }[]).map((tab) => {
              const isActive = activeFloor === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveFloor(tab.id);
                    setSelectedHotspot(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4A24C] to-[#FF8F4D] text-[#030B1A] font-extrabold shadow-md'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Indicador de Total de Visitantes */}
          <div className="flex items-center gap-3 text-xs font-bold text-white/80">
            <span className="flex items-center gap-1.5 text-[#34D399]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
              Sensor Inteligente Activo
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono">
              {floorInfo.totalVisitors} visitas registradas hoy
            </span>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: MAPA vs DIRECTORIO */}
        {viewMode === 'heatmap' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lienzo Visual del Plano Térmico */}
            <div className="lg:col-span-2 relative min-h-[460px] rounded-3xl bg-[#061734] border border-white/15 p-6 overflow-hidden flex flex-col justify-between">
              
              {/* Título de Nivel */}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#FF6B1A]" />
                    {floorInfo.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">{floorInfo.subtitle}</p>
                </div>
              </div>

              {/* Grid Isométrico & Hotspots Térmicos */}
              <div className="relative my-auto w-full h-[320px] rounded-2xl bg-[#030B1A]/80 border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                {/* Cuadrícula técnica del plano */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(#FF6B1A 1px, transparent 1px), linear-gradient(90deg, #FF6B1A 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }}
                />

                {/* Hotspots interactivos en el plano */}
                {floorInfo.defaultHotspots.map((h) => {
                  const isSelected = selectedHotspot?.id === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHotspot(h)}
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    >
                      {/* Aura térmica animada */}
                      <div
                        className={`absolute -inset-4 rounded-full blur-md transition-all duration-500 ${
                          h.intensity > 0.85
                            ? 'bg-[#EF4444]/40 animate-pulse'
                            : h.intensity > 0.65
                            ? 'bg-[#FF6B1A]/40'
                            : 'bg-[#D4A24C]/30'
                        }`}
                      />

                      {/* Pin Central */}
                      <div
                        className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-white font-bold text-[10px] transition-transform duration-300 group-hover:scale-125 shadow-xl ${
                          isSelected
                            ? 'bg-white text-[#030B1A] border-[#FF6B1A] scale-125 ring-4 ring-[#FF6B1A]/50'
                            : h.intensity > 0.85
                            ? 'bg-[#EF4444] border-white'
                            : h.intensity > 0.65
                            ? 'bg-[#FF6B1A] border-white'
                            : 'bg-[#D4A24C] border-white'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>

                      {/* Tooltip Hover con Número de Local */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20 whitespace-nowrap">
                        <div className="bg-[#030B1A]/95 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg border border-white/20 shadow-2xl flex items-center gap-1.5">
                          <span className="text-[#FF8F4D]">{h.localNum}:</span>
                          <span>{h.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[9px] font-mono">
                            {h.visitors} pers
                          </span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#030B1A] rotate-45 border-r border-b border-white/20 -mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda Térmica */}
              <div className="relative z-10 flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Alta Afluencia (&gt;85%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B1A]" /> Tránsito Frecuente
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A24C]" /> Concurrencia Moderada
                  </span>
                </div>
                <span className="text-[11px] text-[#FF8F4D] font-mono">Actualizado hace 2 min</span>
              </div>
            </div>

            {/* Panel Lateral: Detalle del Local Seleccionado */}
            <div className="rounded-3xl bg-[#061734] border border-white/15 p-6 flex flex-col justify-between">
              {selectedHotspot ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 text-[#FF8F4D] text-xs font-bold">
                      {selectedHotspot.localNum}
                    </span>
                    <button
                      onClick={() => setSelectedHotspot(null)}
                      className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xl font-black text-white">{selectedHotspot.name}</h4>
                  <p className="text-xs text-white/60 mt-1 capitalize">Categoría: {selectedHotspot.category}</p>
                  
                  {selectedHotspot.description && (
                    <p className="text-xs text-white/80 mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      {selectedHotspot.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Users className="w-3.5 h-3.5 text-[#FF6B1A]" /> Afluencia
                      </div>
                      <p className="text-lg font-bold text-white mt-1">{selectedHotspot.visitors} pers</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Clock className="w-3.5 h-3.5 text-[#D4A24C]" /> Horario
                      </div>
                      <p className="text-xs font-semibold text-white mt-1">{selectedHotspot.schedule || '10:00 - 21:00'}</p>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#B84D0B]/20 to-[#FF6B1A]/20 border border-[#FF6B1A]/30">
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D4A24C]" />
                      Recogida Automática PaseoYa
                    </p>
                    <p className="text-[11px] text-white/70 mt-1">
                      Al recoger un pedido en este local, el código QR valida la posición de <strong>{selectedHotspot.localNum}</strong> en el mapa de calor de Paseo Aranjuez.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center my-auto py-12">
                  <MapPin className="w-12 h-12 text-white/20 mb-3 animate-bounce" />
                  <h4 className="text-base font-bold text-white">Selecciona un Local</h4>
                  <p className="text-xs text-white/50 max-w-xs mt-1">
                    Haz clic en los puntos del plano para ver el número de local, flujo de clientes y pedir con Click & Collect.
                  </p>
                </div>
              )}

              <Link
                href="/cliente"
                className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Tiendas & Pedir en PaseoYa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Directorio Completo de Locales */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(floorStores.length > 0 ? floorStores : floorInfo.defaultHotspots).map((store: any, idx: number) => {
              const storeName = store.name;
              const storeLocal = store.local_num || store.localNum || `Local ${idx + 101}`;
              const storeCat = store.category || 'Comercial';
              const storeDesc = store.description || 'Establecimiento oficial en Paseo Aranjuez.';
              return (
                <div
                  key={store.id || idx}
                  className="p-5 rounded-2xl bg-[#061734] border border-white/10 hover:border-[#FF6B1A]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#FF6B1A]/20 text-[#FF8F4D] text-[11px] font-bold">
                        {storeLocal}
                      </span>
                      <span className="text-[11px] text-white/40 uppercase tracking-wider">{storeCat}</span>
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-[#FF8F4D] transition-colors">
                      {storeName}
                    </h4>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{storeDesc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/40">{store.schedule || '10:00 - 21:00'}</span>
                    <Link
                      href={store.id ? `/cliente/tiendas/${store.id}` : '/cliente'}
                      className="text-[#FF8F4D] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Ir a tienda</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
