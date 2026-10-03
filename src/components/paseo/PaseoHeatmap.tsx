'use client';

import React, { useState } from 'react';
import { 
  Flame, Layers, MapPin, Users, Clock, Compass, 
  TrendingUp, Eye, Sparkles, Navigation, X, Store, CheckCircle,
  ShieldAlert, PhoneCall, Info, DoorOpen, LogOut, RefreshCw, Trash2, Database
} from 'lucide-react';
import { api, useResource } from './Providers';
import { STATIONS, FLOORS, type Station } from '@/lib/paseo/stations';
import { toast } from 'sonner';
import { ScrollReveal } from './ScrollReveal';

export type FloorId = 'piso-pb' | 'subsuelo' | 'piso-1' | 'piso-2' | 'piso-3';

interface Hotspot {
  id: string;
  name: string;
  category: string;
  localNum: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  intensity: number; // 0 to 1
  visitors: number;
  status: 'Alta' | 'Media' | 'Baja';
  sectorRef?: string;
  emergencyInfo?: string;
}

const FLOOR_DATA: Record<FloorId, { 
  name: string; 
  badge: string;
  subtitle: string; 
  totalVisitors: number; 
  hotspots: Hotspot[] 
}> = {
  'piso-pb': {
    name: 'Planta Baja (PB) — Plano Arquitectónico de Evacuación',
    badge: 'Plano Oficial Aranjuez',
    subtitle: 'Av. América (30,00m) & Calle Pantaleón Dalence (12,00m) · Lobby, Núcleo de Elevadores y Galerías PB',
    totalVisitors: 1180,
    hotspots: [
      { 
        id: 'hpb-1', 
        name: 'Lobby Principal & Núcleo Ascensores PB', 
        category: 'Lobby & Acceso', 
        localNum: 'PB-Lobby', 
        x: 27, 
        y: 35, 
        intensity: 0.98, 
        visitors: 360, 
        status: 'Alta', 
        sectorRef: 'Punto Stand "Usted Se Encuentra Aquí" - Av. América',
        emergencyInfo: 'Junto a baterías de elevadores, gradas principales y extintor E-01.'
      },
      { 
        id: 'hpb-2', 
        name: 'Comercio PB-1 + Mezzanine (Boutiques & Moda)', 
        category: 'Moda & Retail', 
        localNum: 'Local PB-01 / 04', 
        x: 62, 
        y: 25, 
        intensity: 0.91, 
        visitors: 285, 
        status: 'Alta', 
        sectorRef: 'Ala Norte sobre Av. América',
        emergencyInfo: 'Ruta directa hacia Salida Av. América y Calle Dalence.'
      },
      { 
        id: 'hpb-3', 
        name: 'Comercio PB-2 (Tienda Ancla Departamental)', 
        category: 'Gran Salón Comercial', 
        localNum: 'Local PB-02', 
        x: 31, 
        y: 69, 
        intensity: 0.86, 
        visitors: 220, 
        status: 'Alta', 
        sectorRef: 'Ala Suroeste - Salón de Pilares Estructurales',
        emergencyInfo: 'Doble puerta de evacuación con acceso al pasillo central.'
      },
      { 
        id: 'hpb-4', 
        name: 'Acceso Peatonal Dalence & Cafés', 
        category: 'Cafetería & Salida', 
        localNum: 'Local PB-05', 
        x: 79, 
        y: 49, 
        intensity: 0.74, 
        visitors: 175, 
        status: 'Media', 
        sectorRef: 'Ingreso Peatonal Calle Pantaleón Dalence',
        emergencyInfo: 'Salida de emergencia directa con rampa y gradas a calle Dalence.'
      },
      { 
        id: 'hpb-5', 
        name: 'Comercio PB-3 & Patio Verde', 
        category: 'Servicios & Relax', 
        localNum: 'Local PB-03', 
        x: 54, 
        y: 60, 
        intensity: 0.62, 
        visitors: 140, 
        status: 'Media', 
        sectorRef: 'Sector Sur Central junto a SS.HH. y Jardín',
        emergencyInfo: 'Próximo a tablero general (Riesgo Eléctrico) y botiquín de primeros auxilios.'
      },
    ],
  },
  'piso-1': {
    name: 'Piso 1 — Nivel Comercial & Café',
    badge: 'Nivel 1',
    subtitle: 'Acceso Principal Superior, Joyerías, Tecnología y Balcones',
    totalVisitors: 840,
    hotspots: [
      { id: 'h1-1', name: 'Café Aranjuez & Pastelería', category: 'Gastronomía', localNum: 'Local 118', x: 28, y: 35, intensity: 0.92, visitors: 115, status: 'Alta', sectorRef: 'Ala Oeste' },
      { id: 'h1-2', name: 'Plaza Central & Fuentes', category: 'Espacio Cultural', localNum: 'Área Central', x: 50, y: 50, intensity: 0.98, visitors: 260, status: 'Alta', sectorRef: 'Atrio Central' },
      { id: 'h1-3', name: 'Tech Store Bolivia', category: 'Tecnología', localNum: 'Local 104', x: 75, y: 30, intensity: 0.65, visitors: 78, status: 'Media', sectorRef: 'Ala Norte' },
      { id: 'h1-4', name: 'Joyería Altamira', category: 'Lujo', localNum: 'Local 112', x: 80, y: 70, intensity: 0.45, visitors: 42, status: 'Baja', sectorRef: 'Ala Este' },
      { id: 'h1-5', name: 'Escaleras Mecánicas Norte', category: 'Tránsito', localNum: 'Acceso Elevadores', x: 20, y: 75, intensity: 0.85, visitors: 140, status: 'Alta', sectorRef: 'Núcleo Central' },
    ],
  },
  'piso-2': {
    name: 'Piso 2 — Moda, Estética & Arte',
    badge: 'Nivel 2',
    subtitle: 'Boutiques de Autor, Galería Cultural y Servicios Ejecutivos',
    totalVisitors: 620,
    hotspots: [
      { id: 'h2-1', name: 'Moda Élite & Accesorios', category: 'Moda', localNum: 'Local 204', x: 30, y: 30, intensity: 0.88, visitors: 110, status: 'Alta', sectorRef: 'Ala Oeste' },
      { id: 'h2-2', name: 'Galería de Arte Contemporáneo', category: 'Cultura', localNum: 'Mezzanina 2', x: 52, y: 45, intensity: 0.70, visitors: 85, status: 'Media', sectorRef: 'Atrio Este' },
      { id: 'h2-3', name: 'Mundo Regalo & Souvenirs', category: 'Regalos', localNum: 'Local 211', x: 70, y: 65, intensity: 0.62, visitors: 70, status: 'Media', sectorRef: 'Ala Este' },
      { id: 'h2-4', name: 'Barbería Real & Spa', category: 'Estética', localNum: 'Local 216', x: 25, y: 70, intensity: 0.55, visitors: 50, status: 'Media', sectorRef: 'Ala Sur' },
      { id: 'h2-5', name: 'Corredor Escultórico', category: 'Tránsito', localNum: 'Ala Sur', x: 82, y: 30, intensity: 0.38, visitors: 35, status: 'Baja', sectorRef: 'Corredor Dalence' },
    ],
  },
  'piso-3': {
    name: 'Piso 3 — Terraza Gastronómica',
    badge: 'Nivel 3',
    subtitle: 'Alta Cocina, Parrillas a la Leña y Vista Panorámica al Tunari',
    totalVisitors: 980,
    hotspots: [
      { id: 'h3-1', name: 'Terraza Grill & Beer', category: 'Parrilla', localNum: 'Local 302', x: 35, y: 40, intensity: 0.99, visitors: 310, status: 'Alta', sectorRef: 'Terraza Norte' },
      { id: 'h3-2', name: 'Mirador Panorámico Aranjuez', category: 'Turismo', localNum: 'Balcón Este', x: 75, y: 25, intensity: 0.94, visitors: 220, status: 'Alta', sectorRef: 'Mirador Tunari' },
      { id: 'h3-3', name: 'Bar Huari Cenas de Origen', category: 'Coctelería', localNum: 'Local 308', x: 65, y: 70, intensity: 0.82, visitors: 165, status: 'Alta', sectorRef: 'Salón Principal' },
      { id: 'h3-4', name: 'Pastelería & Helados Artesanales', category: 'Postres', localNum: 'Isla 3', x: 22, y: 70, intensity: 0.60, visitors: 90, status: 'Media', sectorRef: 'Atrio Gourmet' },
    ],
  },
  'subsuelo': {
    name: 'Subsuelo 1 & 2 — Parqueos & Pick-up',
    badge: 'Nivel S1/S2',
    subtitle: 'Estacionamiento Inteligente, Zona de Carga y Click & Collect',
    totalVisitors: 450,
    hotspots: [
      { id: 'hs-1', name: 'Zona Click & Collect PaseoYa', category: 'Retiro Exprés', localNum: 'Bahía A-1', x: 45, y: 40, intensity: 0.88, visitors: 95, status: 'Alta', sectorRef: 'Bahía Entrega' },
      { id: 'hs-2', name: 'Estacionamiento VIP Plata/Oro', category: 'Parqueo', localNum: 'Sector S1-C', x: 70, y: 60, intensity: 0.75, visitors: 140, status: 'Media', sectorRef: 'Zona Central S1' },
      { id: 'hs-3', name: 'Boletería & Cajas Automáticas', category: 'Servicio', localNum: 'Lobby S1', x: 25, y: 45, intensity: 0.65, visitors: 70, status: 'Media', sectorRef: 'Acceso Elevadores' },
      { id: 'hs-4', name: 'Estación de Carga Eléctrica', category: 'Eco', localNum: 'Sector Verde', x: 80, y: 25, intensity: 0.40, visitors: 25, status: 'Baja', sectorRef: 'Estación EV' },
    ],
  },
};

export function PaseoHeatmap() {
  const [activeFloor, setActiveFloor] = useState<FloorId>('piso-pb');
  const [viewMode, setViewMode] = useState<'heatmap' | 'directory'>('heatmap');
  const [timeOfDay, setTimeOfDay] = useState<'mediodia' | 'tarde' | 'noche'>('noche');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [showQrStations, setShowQrStations] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  // Consultar telemetría real y simulada agregada desde la API
  const { data: telemetry, loading: telemetryLoading, reload: reloadTelemetry } = useResource<{
    days: number;
    totals: { scans: number; real: number; demo: number };
    floors: Array<{ id: FloorId; label: string; started: number; completed: number; visitors: number }>;
    stations: Array<Station & { total: number; real: number; demo: number; buckets: Record<string, number>; visitors: number }>;
  }>('mapa-calor?dias=7', 20000);

  const handleGenerateDemo = async () => {
    setActionBusy(true);
    try {
      const res = await api<{ ok: boolean; message: string }>('mapa-calor', {
        method: 'POST',
        body: JSON.stringify({ accion: 'demo' }),
      });
      toast.success(res.message || 'Datos de prueba generados con éxito.');
      reloadTelemetry();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar datos.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('¿Deseas limpiar todos los escaneos de prueba?')) return;
    setActionBusy(true);
    try {
      const res = await api<{ ok: boolean; message: string }>('mapa-calor', {
        method: 'POST',
        body: JSON.stringify({ accion: 'limpiar' }),
      });
      toast.success(res.message || 'Datos de prueba eliminados.');
      reloadTelemetry();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al limpiar datos.');
    } finally {
      setActionBusy(false);
    }
  };

  const currentData = FLOOR_DATA[activeFloor];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative overflow-hidden border-t border-white/10">
      {/* Resplandor térmico de fondo */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B1A]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Encabezado */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84D0B]/20 to-[#D4A24C]/20 border border-[#FF6B1A]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-3">
                <Flame className="w-4 h-4 text-[#FF6B1A]" />
                <span>Analítica Espacial · Plano Arquitectónico Oficial</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
                MAPA TÉRMICO & <span className="text-[#FF6B1A]">AFLUENCIA EN VIVO</span>
              </h2>
              <p className="text-white/60 text-sm sm:text-base max-w-2xl mt-2 font-sans">
                Monitoreo en tiempo real según la silueta arquitectónica y plano de evacuación de Paseo Aranjuez. Ubica accesos, núcleos de elevadores, pasillos y comercios.
              </p>
            </div>

            {/* Selector de Modo: Mapa Térmico vs Directorio */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#061734] border border-white/15 self-start md:self-auto">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Mapa Térmico</span>
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

        {/* Barra de Control de Telemetría y Simulación Coherente */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#061734] via-[#081e42] to-[#061734] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#FF6B1A]/20 text-[#FF6B1A]">
                <Database size={16} />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  Telemetría Espacial Coherente
                </span>
                <span className="text-[11px] text-white/50">
                  {telemetry?.totals ? (
                    <>
                      <strong className="text-white">{telemetry.totals.scans}</strong> escaneos analizados (
                      <span className="text-emerald-400 font-semibold">{telemetry.totals.real} reales</span> ·{' '}
                      <span className="text-amber-300 font-semibold">{telemetry.totals.demo} de prueba</span>)
                    </>
                  ) : (
                    'Cargando registros de telemetría...'
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowQrStations(!showQrStations)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                showQrStations 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
              }`}
            >
              {showQrStations ? '✓ Mostrando QRs Inicio/Salida' : '+ Ver QRs en Plano'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateDemo}
              disabled={actionBusy}
              className="py-1.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Genera recorridos simulados con horas pico y distribución realista de pisos"
            >
              <Sparkles size={13} /> ⚡ Generar Datos de Prueba (7 días)
            </button>
            <button
              onClick={handleClearDemo}
              disabled={actionBusy}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Borra escaneos simulados de prueba"
            >
              <Trash2 size={13} /> Limpiar Pruebas
            </button>
            <button
              onClick={() => reloadTelemetry()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros: Selección de Nivel y Horario */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#061734]/80 border border-white/10 mb-6 backdrop-blur-md">
          {/* Tabs de Pisos */}
          <div className="flex flex-wrap items-center gap-2">
            {(['piso-pb', 'piso-1', 'piso-2', 'piso-3', 'subsuelo'] as FloorId[]).map((fId) => {
              const fInfo = FLOOR_DATA[fId];
              const isActive = activeFloor === fId;
              const isPB = fId === 'piso-pb';
              return (
                <button
                  key={fId}
                  onClick={() => {
                    setActiveFloor(fId);
                    setSelectedHotspot(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4A24C] to-[#FF8F4D] text-[#030B1A] font-extrabold shadow-md'
                      : isPB
                      ? 'text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isPB ? 'PISO PB (Oficial)' : fId === 'subsuelo' ? 'Subsuelo' : fId.toUpperCase().replace('-', ' ')}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Área del Plano Arquitectónico / Mapa */}
          <div className="lg:col-span-8 bg-[#061734] border border-white/15 rounded-[2rem] p-4 sm:p-6 relative overflow-hidden shadow-2xl">
            
            {/* Cabecera del Nivel Actual */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/40">
                    {currentData.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                    {currentData.name}
                  </h3>
                </div>
                <p className="text-xs text-white/50 mt-1">{currentData.subtitle}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-[#FF8F4D] tracking-widest block">
                  Afluencia Estimada
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-white tabular-nums">
                  {timeOfDay === 'noche' 
                    ? currentData.totalVisitors 
                    : timeOfDay === 'tarde' 
                    ? Math.round(currentData.totalVisitors * 0.75) 
                    : Math.round(currentData.totalVisitors * 0.55)} personas
                </span>
              </div>
            </div>

            {/* Canvas / Plano SVG Interactivo */}
            <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] bg-[#020814] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
              
              {/* Trazado Arquitectónico Oficial de Planta Baja o Plano Nivel */}
              {activeFloor === 'piso-pb' ? (
                /* SILUETA ARQUITECTÓNICA EXACTA DEL PLANO DE EVACUACIÓN PB */
                <svg 
                  className="absolute inset-0 w-full h-full" 
                  viewBox="0 0 1000 660" 
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Grilla Blueprint */}
                    <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
                    </pattern>
                    <pattern id="arch-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(212,162,76,0.08)" strokeWidth="1" />
                    </pattern>
                    {/* Gradiente de circulación */}
                    <linearGradient id="corridor-glow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                      <stop offset="50%" stopColor="#10b981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                    </linearGradient>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                    </marker>
                  </defs>

                  {/* Fondo Grilla Blueprint */}
                  <rect width="100%" height="100%" fill="url(#arch-grid)" />
                  <rect width="100%" height="100%" fill="url(#arch-grid-major)" />

                  {/* CALLES EXTERIORES */}
                  {/* Av. América (Norte) */}
                  <g className="streets">
                    {/* Línea de calle Av. América */}
                    <line x1="80" y1="45" x2="920" y2="45" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="12 8" opacity="0.4" />
                    <text x="500" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700" letterSpacing="2" opacity="0.75">
                      AV. AMÉRICA DE 30,00 M
                    </text>
                    {/* Franja de vegetación y árboles Av. América */}
                    <rect x="180" y="55" width="560" height="18" rx="4" fill="#065f46" fillOpacity="0.3" stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.4" />
                    <circle cx="230" cy="64" r="6" fill="#10b981" fillOpacity="0.6" />
                    <circle cx="310" cy="64" r="6" fill="#10b981" fillOpacity="0.6" />
                    <circle cx="480" cy="64" r="6" fill="#10b981" fillOpacity="0.6" />
                    <circle cx="560" cy="64" r="6" fill="#10b981" fillOpacity="0.6" />
                    <circle cx="670" cy="64" r="6" fill="#10b981" fillOpacity="0.6" />
                    <text x="500" y="67" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontWeight="600" opacity="0.8">
                      ÁREA VERDE Y CIRCULACIÓN PEATONAL
                    </text>

                    {/* Calle Pantaleón Dalence (Este) */}
                    <line x1="875" y1="120" x2="875" y2="580" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="12 8" opacity="0.4" />
                    <text x="888" y="350" fill="#cbd5e1" fontSize="10" fontWeight="700" letterSpacing="1.5" opacity="0.75" transform="rotate(90 888 350)">
                      CALLE PANTALEÓN DALENCE DE 12,00 M
                    </text>

                    {/* Rosa de los Vientos / Norte */}
                    <g transform="translate(865, 55)">
                      <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#d4a24c" strokeWidth="1.2" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#d4a24c" strokeWidth="1.2" />
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#d4a24c" strokeWidth="0.8" />
                      <polygon points="0,-12 3.5,0 -3.5,0" fill="#ef4444" />
                      <polygon points="0,12 3.5,0 -3.5,0" fill="#94a3b8" />
                      <text x="0" y="-15" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">N</text>
                    </g>
                  </g>

                  {/* CONTORNO DEL EDIFICIO (SILUETA ARQUITECTÓNICA EXACTA DEL PLANO) */}
                  {/* Muros perimetrales exteriores con esquina chaflán/curva en América-Dalence */}
                  <path 
                    d="M 170 85 
                       L 720 85 
                       Q 790 85, 790 155 
                       L 790 490 
                       L 750 490 
                       L 750 430
                       L 670 430
                       L 670 560
                       L 480 560
                       L 480 480
                       L 170 480
                       Z" 
                    fill="#081836" 
                    fillOpacity="0.8" 
                    stroke="#D4A24C" 
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />

                  {/* SECTOR 1: COMERCIO PB - 1 + MEZZANINE (Norte / Av. América) */}
                  <g className="sector-pb1">
                    <rect x="470" y="95" width="280" height="150" fill="#0c234b" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.4" />
                    {/* Sub-divisiones de locales */}
                    <line x1="540" y1="95" x2="540" y2="245" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 2" />
                    <line x1="610" y1="95" x2="610" y2="245" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 2" />
                    <line x1="680" y1="95" x2="680" y2="245" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 2" />
                    {/* Puertas dobles de acceso hacia pasillo central */}
                    <line x1="500" y1="245" x2="520" y2="245" stroke="#10b981" strokeWidth="2.5" />
                    <line x1="570" y1="245" x2="590" y2="245" stroke="#10b981" strokeWidth="2.5" />
                    <line x1="640" y1="245" x2="660" y2="245" stroke="#10b981" strokeWidth="2.5" />
                    <line x1="710" y1="245" x2="730" y2="245" stroke="#10b981" strokeWidth="2.5" />
                    {/* Rótulo */}
                    <text x="610" y="165" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" letterSpacing="0.8">
                      COMERCIO PB - 1 + MEZZANINE
                    </text>
                    <text x="610" y="180" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="600">
                      Boutiques Exclusivas & Showrooms
                    </text>
                  </g>

                  {/* SECTOR 2: COMERCIO PB - 2 (Gran Salón Suroeste / Tienda Ancla) */}
                  <g className="sector-pb2">
                    <rect x="180" y="275" width="280" height="195" fill="#0a1e40" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.4" />
                    {/* Grilla de pilares estructurales del plano */}
                    {[225, 290, 355, 420].map((colX) => (
                      <React.Fragment key={colX}>
                        <rect x={colX - 4} y={320} width="8" height="8" fill="#d4a24c" />
                        <rect x={colX - 4} y={380} width="8" height="8" fill="#d4a24c" />
                        <rect x={colX - 4} y={435} width="8" height="8" fill="#d4a24c" />
                      </React.Fragment>
                    ))}
                    {/* Acceso doble al pasillo */}
                    <line x1="280" y1="275" x2="330" y2="275" stroke="#10b981" strokeWidth="3" />
                    {/* Rótulo */}
                    <text x="320" y="360" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" letterSpacing="0.8">
                      COMERCIO PB - 2
                    </text>
                    <text x="320" y="375" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">
                      Tienda Ancla Departamental (Pilares Estructurales)
                    </text>
                  </g>

                  {/* SECTOR 3: COMERCIO PB - 3, SERVICIOS TÉCNICOS & BAÑOS */}
                  <g className="sector-pb3">
                    <rect x="475" y="275" width="180" height="85" fill="#0c234b" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.4" />
                    <text x="565" y="315" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
                      COMERCIO PB - 3
                    </text>
                    <line x1="510" y1="275" x2="540" y2="275" stroke="#10b981" strokeWidth="2.5" />

                    {/* SS.HH. y Tableros Eléctricos */}
                    <rect x="475" y="368" width="85" height="52" fill="#08142b" stroke="#64748b" strokeWidth="1" />
                    <text x="517" y="398" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">SS.HH.</text>
                    
                    {/* Riesgo Eléctrico */}
                    <rect x="565" y="368" width="90" height="52" fill="#08142b" stroke="#eab308" strokeWidth="1" />
                    <polygon points="610,380 618,396 602,396" fill="#eab308" />
                    <text x="610" y="394" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="900">⚡</text>
                    <text x="610" y="410" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="700">RIESGO ELÉCTRICO</text>
                  </g>

                  {/* SECTOR 4: PATIO INTERIOR / ÁREA VERDE */}
                  <g className="sector-green">
                    <rect x="485" y="490" width="175" height="60" rx="6" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.2" />
                    <circle cx="530" cy="520" r="10" fill="#10b981" fillOpacity="0.5" />
                    <circle cx="572" cy="520" r="10" fill="#10b981" fillOpacity="0.5" />
                    <circle cx="615" cy="520" r="10" fill="#10b981" fillOpacity="0.5" />
                    <text x="572" y="540" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="800" letterSpacing="1">
                      ÁREA VERDE INTERIOR
                    </text>
                  </g>

                  {/* NÚCLEO DE ACCESO: LOBBY, ASCENSORES & GRADAS PB */}
                  <g className="lobby-elevadores">
                    {/* Caja de elevadores */}
                    <rect x="250" y="140" width="85" height="110" fill="#07152d" stroke="#d4a24c" strokeWidth="1.5" />
                    {/* Cabina Elevador 1 y 2 */}
                    <rect x="258" y="150" width="32" height="42" fill="#0f2b57" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="274" y1="150" x2="274" y2="192" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
                    <rect x="296" y="150" width="32" height="42" fill="#0f2b57" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="312" y1="150" x2="312" y2="192" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
                    <text x="293" y="132" textAnchor="middle" fill="#d4a24c" fontSize="9" fontWeight="800">
                      NÚCLEO ASCENSORES
                    </text>

                    {/* Gradas de acceso arquitectónicas */}
                    <rect x="258" y="200" width="70" height="42" fill="#0a1a36" stroke="#94a3b8" strokeWidth="0.8" />
                    {[206, 212, 218, 224, 230, 236].map((stepY) => (
                      <line key={stepY} x1="258" y1={stepY} x2="328" y2={stepY} stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
                    ))}
                    <text x="293" y="248" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontWeight="600">
                      GRADAS PB - P1
                    </text>

                    {/* ICONO DEL PLANO: "USTED SE ENCUENTRA AQUÍ" (Punto Stand oficial) */}
                    <g transform="translate(242, 195)">
                      <circle cx="0" cy="0" r="14" fill="#ef4444" fillOpacity="0.25" className="animate-ping" />
                      <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="0" cy="0" r="3" fill="#ffffff" />
                      <rect x="-65" y="-28" width="130" height="18" rx="4" fill="#030b1a" stroke="#ef4444" strokeWidth="1" />
                      <text x="0" y="-16" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
                        USTED SE ENCUENTRA AQUÍ
                      </text>
                    </g>
                  </g>

                  {/* ARTERIA DE CIRCULACIÓN PEATONAL & RUTAS DE EVACUACIÓN */}
                  <g className="circulacion">
                    {/* Iluminación de Pasillo en L */}
                    <path 
                      d="M 180 100 
                         L 240 100 
                         L 240 260 
                         L 470 260 
                         L 780 260 
                         L 780 430
                         L 740 430
                         L 740 270
                         L 460 270
                         L 230 270
                         L 230 100
                         Z" 
                      fill="url(#corridor-glow)" 
                    />
                    <text x="590" y="260" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="800" letterSpacing="2" opacity="0.9">
                      ◄ ÁREA DE CIRCULACIÓN PRINCIPAL ►
                    </text>

                    {/* Flechas Verdes de Evacuación (conforme al plano) */}
                    {/* Hacia Av. América */}
                    <path d="M 235 150 L 235 110" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <path d="M 235 220 L 235 170" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    {/* Giro hacia Dalence */}
                    <path d="M 370 265 L 430 265" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <path d="M 480 265 L 540 265" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <path d="M 590 265 L 650 265" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <path d="M 700 265 L 760 265" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    {/* Hacia Salida Dalence */}
                    <path d="M 770 300 L 770 360" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <path d="M 770 380 L 770 440" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />

                    {/* SALIDAS DE EMERGENCIA */}
                    {/* Salida Norte (Av. América) */}
                    <g transform="translate(195, 80)">
                      <rect x="0" y="0" width="34" height="14" rx="2" fill="#047857" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="17" y="10" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="800">SALIDA</text>
                    </g>
                    {/* Salida Este (Pantaleón Dalence con gradas) */}
                    <g transform="translate(760, 460)">
                      <rect x="0" y="0" width="34" height="14" rx="2" fill="#047857" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="17" y="10" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="800">SALIDA</text>
                      {/* Gradas exteriores a Dalence */}
                      {[16, 20, 24, 28].map((gY) => (
                        <line key={gY} x1="0" y1={gY} x2="34" y2={gY} stroke="#94a3b8" strokeWidth="0.8" />
                      ))}
                    </g>

                    {/* Estaciones de Extintores y Botiquines del Plano */}
                    <circle cx="255" cy="275" r="4" fill="#ef4444" />
                    <circle cx="465" cy="275" r="4" fill="#ef4444" />
                    <circle cx="675" cy="275" r="4" fill="#ef4444" />
                    <rect x="745" y="360" width="8" height="8" rx="1" fill="#10b981" />
                    <text x="749" y="366" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="900">+</text>
                  </g>

                  {/* PIE DE PLANO: LEYENDA OFICIAL PASEO ARANJUEZ */}
                  <g transform="translate(160, 600)">
                    <rect x="0" y="0" width="680" height="42" rx="8" fill="#051329" stroke="#d4a24c" strokeWidth="1" strokeOpacity="0.4" />
                    
                    {/* Logo & Datos Arquitecto */}
                    <text x="20" y="18" fill="#ffffff" fontSize="10" fontWeight="900" letterSpacing="1">PASEO ARANJUEZ</text>
                    <text x="20" y="32" fill="#d4a24c" fontSize="8" fontWeight="600">PISO PB · PLANO OFICIAL</text>
                    
                    <line x1="160" y1="6" x2="160" y2="36" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    
                    {/* Teléfonos de Emergencia Cochabamba */}
                    <text x="175" y="16" fill="#94a3b8" fontSize="7" fontWeight="600">EN CASO DE EMERGENCIA:</text>
                    <text x="175" y="30" fill="#f8fafc" fontSize="8" fontWeight="700">
                      Radio Patrullas: <tspan fill="#38bdf8">110</tspan> · Bomberos: <tspan fill="#ef4444">119</tspan> · SAR: <tspan fill="#34d399">4486996</tspan> · Ambulancia: <tspan fill="#fbbf24">165</tspan>
                    </text>

                    <line x1="510" y1="6" x2="510" y2="36" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                    <text x="525" y="18" fill="#94a3b8" fontSize="7" fontWeight="600">PROYECTO ARQUITECTÓNICO:</text>
                    <text x="525" y="31" fill="#cbd5e1" fontSize="8" fontWeight="700">Arq. Daniel Enríquez Espinoza</text>
                  </g>
                </svg>
              ) : (
                /* SILUETA MODERNA DE LOS OTROS PISOS (Niveles Superiores / Subsuelo) */
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid-pattern-other" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-pattern-other)" />
                  <rect x="15%" y="15%" width="70%" height="70%" fill="none" stroke="#D4A24C" strokeWidth="2" strokeDasharray="6 4" />
                  <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#FF6B1A" strokeWidth="1.5" />
                  <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </svg>
              )}

              {/* Indicador de Orientación Top-Left */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-[10px] font-mono text-white/70 backdrop-blur-sm z-20">
                <Compass className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>NORTE: AV. AMÉRICA (30m)</span>
              </div>

              {/* Hotspots térmicos interactivos sobre el plano */}
              {currentData.hotspots.map((spot) => {
                const isSelected = selectedHotspot?.id === spot.id;
                const dynamicVisitors = 
                  timeOfDay === 'noche'
                    ? spot.visitors
                    : timeOfDay === 'tarde'
                    ? Math.round(spot.visitors * 0.75)
                    : Math.round(spot.visitors * 0.55);

                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedHotspot(spot)}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    {/* Halo de Calor / Heatmap glow */}
                    {viewMode === 'heatmap' && (
                      <div
                        className={`absolute -inset-6 sm:-inset-8 rounded-full pointer-events-none transition-all duration-500 ${
                          spot.intensity > 0.8
                            ? 'bg-red-500/35 animate-pulse'
                            : spot.intensity > 0.6
                            ? 'bg-[#FF6B1A]/35'
                            : 'bg-emerald-500/35'
                        }`}
                        style={{
                          transform: `scale(${isSelected ? 1.4 : 1})`,
                          filter: 'blur(10px)',
                        }}
                      />
                    )}

                    {/* Pin / Botón del Marcador */}
                    <div
                      className={`relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-125 ${
                        isSelected ? 'scale-125' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-white shadow-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-[#FF6B1A] border-white ring-4 ring-[#FF6B1A]/50 scale-110'
                            : spot.intensity > 0.8
                            ? 'bg-red-500 border-white/90'
                            : spot.intensity > 0.6
                            ? 'bg-amber-500 border-white/90'
                            : 'bg-emerald-500 border-white/90'
                        }`}
                      >
                        {spot.localNum.replace('Local ', '').slice(0, 3)}
                      </div>

                      {/* Tooltip con nombre y afluencia al hacer hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                        <div className="bg-[#061734] border border-[#FF6B1A]/60 px-3 py-1.5 rounded-xl shadow-2xl text-center backdrop-blur-md">
                          <p className="text-xs font-bold text-white">{spot.name}</p>
                          <p className="text-[10px] text-[#FF8F4D] font-mono">{spot.localNum} · {dynamicVisitors} personas</p>
                          {spot.sectorRef && (
                            <p className="text-[9px] text-white/50">{spot.sectorRef}</p>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-[#061734] border-r border-b border-[#FF6B1A]/60 rotate-45 -mt-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda Térmica y de Evacuación */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/60 gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white/80">Escala Térmica:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[11px]">Alta (&gt;80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF6B1A]" />
                    <span className="text-[11px]">Media (50-80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px]">Tranquila (&lt;50%)</span>
                  </div>
                </div>
              </div>

              {activeFloor === 'piso-pb' && (
                <div className="flex items-center gap-3 text-[11px] text-white/60">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Rutas de Evacuación Activas
                  </span>
                  <span className="hidden sm:inline text-white/30">|</span>
                  <span className="hidden sm:inline">Av. América & Dalence</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel Lateral: Detalle del Local Seleccionado & Métricas */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Card del Local Seleccionado */}
            <div className="p-5 sm:p-6 rounded-[2rem] bg-[#061734] border border-white/15 text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block mb-2">
                Punto de Afluencia Seleccionado
              </span>

              {selectedHotspot ? (
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <h4 className="text-lg sm:text-xl font-black font-display text-white leading-tight">
                        {selectedHotspot.name}
                      </h4>
                      <p className="text-xs text-[#FF8F4D] font-bold mt-0.5">
                        {selectedHotspot.localNum} · {selectedHotspot.category}
                      </p>
                      {selectedHotspot.sectorRef && (
                        <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#D4A24C] shrink-0" />
                          <span>{selectedHotspot.sectorRef}</span>
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      selectedHotspot.status === 'Alta' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : selectedHotspot.status === 'Media'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {selectedHotspot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-semibold">Visitantes ahora</span>
                      <span className="text-xl font-mono font-black text-white tabular-nums">
                        {timeOfDay === 'noche'
                          ? selectedHotspot.visitors
                          : timeOfDay === 'tarde'
                          ? Math.round(selectedHotspot.visitors * 0.75)
                          : Math.round(selectedHotspot.visitors * 0.55)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-semibold">Densidad térmica</span>
                      <span className="text-xl font-mono font-black text-[#FF6B1A] tabular-nums">
                        {Math.round(selectedHotspot.intensity * 100)}%
                      </span>
                    </div>
                  </div>

                  {selectedHotspot.emergencyInfo && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 mb-3 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{selectedHotspot.emergencyInfo}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1 mb-2">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Retiro PaseoYa Click & Collect disponible.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Puntos dobles con QR presencial.</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-white/50">
                  <Compass className="w-10 h-10 mx-auto stroke-[1.5] mb-2 text-white/30 animate-pulse" />
                  <p className="text-sm font-bold text-white/70">Selecciona un punto en el plano</p>
                  <p className="text-xs mt-1">Haz clic en los marcadores del mapa arquitectónico para ver afluencia, personas y datos de seguridad.</p>
                </div>
              )}
            </div>

            {/* Números de Emergencia & Protocolo */}
            <div className="p-5 rounded-[2rem] bg-gradient-to-br from-[#061734] to-[#030B1A] border border-[#D4A24C]/30 text-white shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
                  Seguridad & Evacuación PB
                </span>
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-white/60">Salidas Rápidas:</span>
                  <span className="font-bold text-emerald-400">Av. América & Dalence</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-white/60">Ascensores / Gradas:</span>
                  <span className="font-bold text-[#FF8F4D]">Núcleo Central Operativo</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-white/60">Bomberos Cochabamba:</span>
                  <span className="font-mono font-bold text-red-400">119</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Radio Patrullas 110:</span>
                  <span className="font-mono font-bold text-[#38bdf8]">110 / 4486996</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
