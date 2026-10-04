'use client';

import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Building,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ChakanaIcon } from './ChakanaIcon';

interface ArchitecturalSpace {
  id: 'terraza' | 'fachada' | 'torres';
  title: string;
  subtitle: string;
  badge: string;
  liveStatus: string;
  description: string;
  floor: string;
  accentColor: string;
  bgGradient: string;
  borderHover: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  specs: { label: string; value: string }[];
  extendedText: string;
}

const SPACES: ArchitecturalSpace[] = [
  {
    id: 'terraza',
    title: 'Terrazas 360° en El Cuarto',
    subtitle: 'Mirador Gastronómico & Coctelería de Autor',
    badge: 'Piso 4 · Rooftop Exclusivo',
    liveStatus: '🟢 Abierto hoy · 11:30 a 01:00',
    description:
      'Ubicada en el 4to piso, la terraza gastronómica integra 8 barras gourmet de autor y coctelería premium con vistas panorámicas inigualables a la cordillera del Tunari.',
    floor: 'Piso 4 · Vista Panorámica',
    accentColor: '#D4A24C',
    bgGradient: 'linear-gradient(145deg, #1C150A 0%, #080705 60%, #241A0B 100%)',
    borderHover: 'hover:border-[#D4A24C]',
    icon: Compass,
    features: [
      '8 Barras Gourmet de Autor',
      'Coctelería & Cervecería Huari',
      'Vistas 360° a la Cordillera Tunari',
      'Lounge Climatizado & Terraza Libre',
    ],
    specs: [
      { label: 'Superficie', value: '1.400 m² de Rooftop' },
      { label: 'Capacidad', value: '450 personas' },
      { label: 'Gastronomía', value: '8 cocinas de autor' },
      { label: 'Horario', value: '11:30 a 01:00 todos los días' },
    ],
    extendedText:
      'El Cuarto es el corazón culinario de Paseo Aranjuez. Diseñado como un mirador suspendido sobre la ciudad, combina arquitectura bioclimática con jardines verticales y estaciones gastronómicas que van desde cortes a la leña hasta cocina fusión asiática.',
  },
  {
    id: 'fachada',
    title: 'Fachada Lumínica LED Dinámica',
    subtitle: 'Tecnología Lumínica & Arte Digital Monumental',
    badge: 'Hito Urbano Cochabamba',
    liveStatus: '✨ Show Lumínico · Cada noche 19:30',
    description:
      'Sistema inteligente con más de 20.000 nodos LED dinámicos de alta definición que transforman la Torre en un lienzo digital sobre la icónica avenida América.',
    floor: 'Fachada Principal · Av. América',
    accentColor: '#FF6B1A',
    bgGradient: 'linear-gradient(145deg, #200E06 0%, #090503 60%, #2A1308 100%)',
    borderHover: 'hover:border-[#FF6B1A]',
    icon: Sparkles,
    features: [
      '20.000+ Nodos LED RGB Dinámicos',
      'Secuencias de Arte Digital en Vivo',
      'Eficiencia Eco-Sostenible Clase A',
      'Monitoreo Centralizado Automatizado',
    ],
    specs: [
      { label: 'Nodos LED', value: '+20.000 unidades RGB' },
      { label: 'Controlador', value: 'Art-Net DMX en tiempo real' },
      { label: 'Consumo', value: 'Tecnología Ultra Low-Power' },
      { label: 'Espectáculo', value: 'Programación temática diaria' },
    ],
    extendedText:
      'La fachada lumínica de Paseo Aranjuez es una obra de ingeniería visual única en Bolivia. Cada nodo LED es direccionable independientemente, permitiendo sincronizaciones artísticas para fechas patrias, festivales de cine y activaciones visuales interactivas.',
  },
  {
    id: 'torres',
    title: 'Torres Corporativas Inteligentes',
    subtitle: 'Pisos 5 al 11 · Business & Medical Hub',
    badge: 'Torres A & B · Niveles 5 al 11',
    liveStatus: '🛡️ Seguridad & Acceso Biométrico 24/7',
    description:
      'Pisos 5 al 11 diseñados para consultorios médicos de alta especialidad, prestigiosos bufetes jurídicos y sedes corporativas con ascensores de alta velocidad.',
    floor: 'Torres A & B (Pisos 5-11)',
    accentColor: '#7A8B5C',
    bgGradient: 'linear-gradient(145deg, #111A10 0%, #060905 60%, #162414 100%)',
    borderHover: 'hover:border-[#7A8B5C]',
    icon: Building,
    features: [
      'Consultorios Médicos de Alta Complejidad',
      'Firmas Corporativas & Agencias Globales',
      '4 Ascensores Inteligentes de Alta Velocidad',
      'Fibra Óptica Redundante & Climatización Central',
    ],
    specs: [
      { label: 'Niveles', value: '7 Pisos de oficinas y clínicas' },
      { label: 'Ascensores', value: '4 unidades inteligentes Schindler' },
      { label: 'Conectividad', value: 'Doble anillo de fibra óptica' },
      { label: 'Seguridad', value: 'CCTV y control biométrico 24/7' },
    ],
    extendedText:
      'Las Torres Corporativas A & B ofrecen infraestructura de estándar internacional en el nodo financiero y residencial más cotizado de Cochabamba. Con estacionamiento cubierto automatizado, salas de conferencias VIP y acceso controlado mediante credenciales inteligentes.',
  },
];

export function CulturalSection() {
  const [selectedSpace, setSelectedSpace] = useState<ArchitecturalSpace | null>(null);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#030B1A] relative border-t border-white/5 overflow-hidden">
      {/* Resplandores ambientales de fondo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#FF6B1A]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7A8B5C]/20 border border-[#7A8B5C]/40 text-xs font-bold uppercase tracking-wider text-[#9BB375] mb-4 shadow-sm">
            <ChakanaIcon size={14} className="text-[#9BB375]" />
            <span>Diseño & Espacios Exclusivos</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight">
            ARQUITECTURA &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A24C] via-[#FF8F4D] to-[#7A8B5C]">
              VANGUARDIA
            </span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg mt-3 font-sans max-w-2xl mx-auto leading-relaxed">
            Torre Paseo Aranjuez combina tecnología lumínica de última generación con amplias terrazas
            panorámicas y diseño bioclimático contemporáneo en cada nivel.
          </p>
        </div>

        {/* 3 Pilares Arquitectónicos con Diseño de Alta Gama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SPACES.map((space) => {
            const Icon = space.icon;
            return (
              <div
                key={space.id}
                onClick={() => setSelectedSpace(space)}
                className={`group rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:-translate-y-2 border border-white/10 ${space.borderHover} shadow-2xl relative overflow-hidden`}
                style={{
                  background: space.bgGradient,
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
                }}
              >
                {/* Línea LED de acento superior */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 group-hover:opacity-100 opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${space.accentColor}, transparent)`,
                  }}
                />

                {/* Resplandor radial interno en hover */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                  style={{ backgroundColor: space.accentColor }}
                />

                <div>
                  {/* Fila superior: Icono y Badge de Estado */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-13 h-13 rounded-2xl p-3 shadow-lg flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: `${space.accentColor}25`,
                        color: space.accentColor,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                      {space.badge}
                    </span>
                  </div>

                  {/* Estado en Vivo */}
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-emerald-400/90 flex items-center gap-1.5">
                      {space.liveStatus}
                    </span>
                  </div>

                  {/* Título y Subtítulo */}
                  <h3 className="text-2xl font-black text-white font-display tracking-tight mb-1 group-hover:text-white transition-colors">
                    {space.title}
                  </h3>
                  <p className="text-xs text-[#D4A24C] font-semibold mb-3">
                    {space.subtitle}
                  </p>

                  <p className="text-xs text-white/70 leading-relaxed font-sans mb-5">
                    {space.description}
                  </p>

                  {/* Lista de Características clave */}
                  <div className="space-y-2 border-t border-white/10 pt-4 mb-6">
                    {space.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-white/80">
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: space.accentColor }}
                        />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Interactivo de la Tarjeta */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold transition-all">
                  <span style={{ color: space.accentColor }}>{space.floor}</span>
                  <div className="flex items-center gap-1 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all">
                    <span>Explorar Ficha</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Interactivo de Ficha Arquitectónica */}
      {selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedSpace(null)}
            className="fixed inset-0 bg-[#030B1A]/85 backdrop-blur-md animate-in fade-in duration-200"
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#061734] border border-[#D4A24C]/40 p-6 sm:p-8 text-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Línea LED de encabezado */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, #D4A24C, ${selectedSpace.accentColor}, #7A8B5C)`,
              }}
            />

            <button
              onClick={() => setSelectedSpace(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Modal */}
            <div className="flex items-center gap-3.5 mb-5">
              <div
                className="w-14 h-14 rounded-2xl p-3 flex items-center justify-center border border-white/20 shadow-md"
                style={{
                  backgroundColor: `${selectedSpace.accentColor}25`,
                  color: selectedSpace.accentColor,
                }}
              >
                {React.createElement(selectedSpace.icon, { className: 'w-7 h-7' })}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
                  {selectedSpace.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
                  {selectedSpace.title}
                </h3>
                <span className="text-xs text-emerald-400 font-semibold">
                  {selectedSpace.liveStatus}
                </span>
              </div>
            </div>

            {/* Texto Detallado */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                {selectedSpace.extendedText}
              </p>
            </div>

            {/* Grid de Especificaciones Técnicas */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-bold tracking-wider text-white/50 mb-3">
                Ficha Técnica & Capacidades
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedSpace.specs.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 text-center"
                  >
                    <span className="text-[10px] text-white/50 uppercase font-semibold block mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficios & Características */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-bold tracking-wider text-white/50 mb-2.5">
                Ventajas Arquitectónicas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                {selectedSpace.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
                  >
                    <CheckCircle2
                      className="w-4 h-4 shrink-0"
                      style={{ color: selectedSpace.accentColor }}
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              onClick={() => setSelectedSpace(null)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs uppercase tracking-wider btn-primary-andino flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/20"
            >
              <span>Entendido · Cerrar Ficha</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
