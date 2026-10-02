'use client';

import React, { useState } from 'react';
import { Store, Truck, Building, MapPin, Clock, ShieldCheck, ArrowRight, PhoneCall, Check } from 'lucide-react';
import { tacticalAudio } from '@/lib/tactical-audio';

interface DispatchZone {
  id: string;
  type: 'pickup' | 'moto' | 'metropolis' | 'flota';
  tabLabel: string;
  name: string;
  origin: string;
  dest: string;
  cost: number;
  timeEstimate: string;
  securityBadge: string;
  desc: string;
  whatsappMessage: string;
}

const dispatchZones: DispatchZone[] = [
  {
    id: 'z1',
    type: 'pickup',
    tabLabel: 'RETIRO ALMACÉN',
    name: 'Almacén Central Cochabamba (Heroínas)',
    origin: 'Base Táctica Cochabamba',
    dest: 'Av. Heroínas #560 e/ San Martín y 25 de Mayo',
    cost: 0,
    timeEstimate: 'Inmediato (09:00 - 19:00)',
    securityBadge: 'RETIRO INMEDIATO · 100% GRATIS',
    desc: 'Recoge personalmente en nuestro centro logístico en el Casco Viejo. Verifica y prueba tu equipamiento antes de retirarlo.',
    whatsappMessage: 'Hola, deseo coordinar recojo personal en almacén central de Av. Heroínas Cochabamba.',
  },
  {
    id: 'z2',
    type: 'moto',
    tabLabel: 'DELIVERY CERCADO',
    name: 'Motorizado Express Cercado (Norte, Centro, Sur)',
    origin: 'Almacén Central (Heroínas)',
    dest: 'Tu domicilio o puesto de comando en Cochabamba',
    cost: 12,
    timeEstimate: '45 - 90 minutos',
    securityBadge: 'CHOFER TÁCTICO VERIFICADO',
    desc: 'Repartidor motorizado propio con mochila térmica sellada. Pago contra entrega en efectivo o QR disponible al recibir.',
    whatsappMessage: 'Hola, requiero delivery motorizado express en Cochabamba Cercado.',
  },
  {
    id: 'z3',
    type: 'metropolis',
    tabLabel: 'SACABA / QUILLACOLLO',
    name: 'Metropolitana (Quillacollo, Sacaba, Tiquipaya)',
    origin: 'Almacén Central (Heroínas)',
    dest: 'Municipios del Valle Central de Cochabamba',
    cost: 20,
    timeEstimate: '2 - 3 horas',
    securityBadge: 'RASTREO EN TIEMPO REAL',
    desc: 'Despacho directo por carretera principal sin demoras. Llega directamente hasta tu base o domicilio.',
    whatsappMessage: 'Hola, requiero envío express a Quillacollo/Sacaba/Tiquipaya.',
  },
  {
    id: 'z4',
    type: 'flota',
    tabLabel: 'FLOTA TODA BOLIVIA',
    name: 'Despacho Flota Terminal (La Paz, Santa Cruz, Oruro, Sucre...)',
    origin: 'Terminal de Buses Cochabamba',
    dest: 'Terminal de Buses de tu ciudad (Todo el país)',
    cost: 35,
    timeEstimate: '12 - 24 horas',
    securityBadge: 'GUÍA DE FLOTA OFICIAL',
    desc: 'Empaque hermético triple capa antimanipulación. Te enviamos la foto de la guía y el boleto de encomienda por WhatsApp.',
    whatsappMessage: 'Hola, deseo coordinar envío interdepartamental por flota desde Terminal Cochabamba.',
  },
];

export function TacticalDeliverySimulator() {
  const [selectedZone, setSelectedZone] = useState<DispatchZone>(dispatchZones[0]);
  const [progress, setProgress] = useState(100);

  const handleSelect = (zone: DispatchZone) => {
    tacticalAudio.playLockOn();
    setSelectedZone(zone);
    setProgress(0);
    setTimeout(() => setProgress(100), 50);
  };

  return (
    <div className="w-full rounded-2xl border border-[#22222A] bg-[#0c0c10]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 tactical-grid-bg opacity-30 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#22222A]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#C8A961] uppercase tracking-widest mb-1">
            <Truck size={14} className="animate-pulse" />
            <span>DISPATCH & RUTA EN TIEMPO REAL · COCHABAMBA</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">
            SIMULADOR LOGÍSTICO TÁCTICO
          </h3>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#30A46C]/10 border border-[#30A46C]/25 text-[#30A46C] text-xs font-mono font-bold w-fit">
          <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-ping" />
          <span>FLOTA & MOTORIZADOS ACTIVOS</span>
        </div>
      </div>

      {/* Zone Selector Tabs */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
        {dispatchZones.map((zone) => {
          const isSelected = selectedZone.id === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => handleSelect(zone)}
              className={`p-3 rounded-xl text-left font-mono transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#C8A961]/15 border-[#C8A961] shadow-[0_0_20px_rgba(200,169,97,0.25)]'
                  : 'bg-[#111116] border-[#22222A] hover:border-[#35353E] text-[#A1A1AA]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {zone.type === 'pickup' && <Store size={16} className={isSelected ? 'text-[#C8A961]' : ''} />}
                {zone.type === 'moto' && <Truck size={16} className={isSelected ? 'text-[#C8A961]' : ''} />}
                {zone.type === 'metropolis' && <MapPin size={16} className={isSelected ? 'text-[#C8A961]' : ''} />}
                {zone.type === 'flota' && <Building size={16} className={isSelected ? 'text-[#C8A961]' : ''} />}
                {isSelected && <Check size={14} className="text-[#C8A961]" />}
              </div>
              <span className={`text-[11px] font-bold block ${isSelected ? 'text-white' : 'text-[#7A7A85]'}`}>
                {zone.tabLabel}
              </span>
              <span className={`text-xs font-extrabold mt-1 block ${isSelected ? 'text-[#DEC07A]' : 'text-[#5E5E68]'}`}>
                {zone.cost === 0 ? 'GRATIS' : `Bs. ${zone.cost.toFixed(2)}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Telemetry Route Display */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#07070a] border border-[#22222A] rounded-xl p-6">
        {/* Left: Origin to Destination Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#C8A961] uppercase tracking-wider font-bold">
              {selectedZone.securityBadge}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-mono">
              <Clock size={13} className="text-[#C8A961]" />
              <span>ETA: <strong>{selectedZone.timeEstimate}</strong></span>
            </div>
          </div>

          <h4 className="text-lg font-bold text-white uppercase">{selectedZone.name}</h4>
          <p className="text-xs text-[#7A7A85] leading-relaxed">{selectedZone.desc}</p>

          {/* Animated Waypoint Route Line */}
          <div className="pt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA] mb-2">
              <span className="flex items-center gap-1 text-[#30A46C]">
                <MapPin size={12} /> {selectedZone.origin}
              </span>
              <span className="flex items-center gap-1 text-[#C8A961]">
                <MapPin size={12} /> {selectedZone.dest}
              </span>
            </div>

            <div className="h-2 w-full bg-[#14141a] rounded-full overflow-hidden relative border border-[#22222A]">
              <div
                className="h-full bg-gradient-to-r from-[#30A46C] via-[#C8A961] to-[#DEC07A] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-3 bg-white/80 rounded-full blur-[1px] animate-pulse"
                style={{ left: `calc(${progress}% - 12px)` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Cost & Direct Action */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-[#111117] border border-[#22222A] space-y-4">
          <div>
            <span className="text-[10px] font-mono text-[#5E5E68] uppercase block">TARIFA DE ENVÍO</span>
            <div className="text-3xl font-extrabold font-mono text-white text-glow-gold">
              {selectedZone.cost === 0 ? 'Bs. 0.00' : `Bs. ${selectedZone.cost.toFixed(2)}`}
            </div>
            <span className="text-[10px] font-mono text-[#30A46C] block mt-1">
              ✓ Sin costos ocultos · Tarifa plana
            </span>
          </div>

          <a
            href={`https://wa.me/59171234567?text=${encodeURIComponent(selectedZone.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactical text-xs py-3 px-4 w-full flex items-center justify-center gap-2 shadow-lg"
          >
            <PhoneCall size={14} />
            <span>COORDINAR POR WHATSAPP</span>
          </a>
        </div>
      </div>
    </div>
  );
}
