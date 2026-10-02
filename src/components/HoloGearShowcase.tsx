'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Crosshair, Shield, Zap, Sparkles, ShoppingCart, Layers, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { tacticalAudio } from '@/lib/tactical-audio';
import type { Product } from '@/lib/types';

interface HoloGearShowcaseProps {
  products: Product[];
}

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  tag: string;
  desc: string;
  stat: string;
}

export function HoloGearShowcase({ products }: HoloGearShowcaseProps) {
  const { addItem } = useCart();
  const cardRef = useRef<HTMLDivElement>(null);

  const [activeGearIndex, setActiveGearIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // 3D Tilt State
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Showcase items
  const gearItems = [
    {
      title: 'Plate Carrier Nivel IV',
      category: 'Protección Balística',
      spec: 'STANAG 4569 · Nivel IV Cerámica',
      price: 'Bs. 340.00',
      image: 'https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80',
      productRef: products.find(p => p.id === 'prod-01') || products[0],
      hotspots: [
        { id: 'h1', x: 50, y: 35, title: 'Panel Balístico NIJ-IV', tag: 'CERÁMICA + PE', desc: 'Detención múltiple impacto calibre 7.62x51mm OTAN.', stat: '99.4% ABSORCIÓN' },
        { id: 'h2', x: 28, y: 55, title: 'Hebilla Cobra 7075-T6', tag: 'LIBERACIÓN RÁPIDA', desc: 'Apertura táctica en 0.2s bajo +900 kg de tensión.', stat: 'TSI CERTIFIED' },
        { id: 'h3', x: 72, y: 55, title: 'MOLLE Corte Láser', tag: 'CORDURA 1000D', desc: 'Matriz modular con sellado hidrofóbico impermeable.', stat: '-30% PESO' },
      ],
    },
    {
      title: 'Mira Holográfica EOTech XPS3',
      category: 'Óptica de Precisión',
      spec: 'Punto Rojo 68 MOA · Sumergible 10m',
      price: 'Bs. 380.00',
      image: 'https://images.unsplash.com/photo-1784612212663-716f0518783d?w=800&auto=format&fit=crop&q=80',
      productRef: products.find(p => p.id === 'prod-03') || products[2] || products[0],
      hotspots: [
        { id: 'h4', x: 50, y: 40, title: 'Lente Espectral Antirreflejo', tag: 'ÓPTICA NVG', desc: 'Retícula nítida sin paralaje compatible con visores nocturnos.', stat: '100% TRANSMISIÓN' },
        { id: 'h5', x: 30, y: 65, title: 'Carcasa 7075-T6 Hardcoat', tag: 'ALUMINIO AERO', desc: 'Resiste caídas sobre roca desde 3 metros sin descalibrar.', stat: 'IP68 SEALED' },
      ],
    },
    {
      title: 'Botas Tácticas Desert Storm',
      category: 'Calzado Táctico',
      spec: 'Suela Vibram · Membrana Gore-Tex',
      price: 'Bs. 310.00',
      image: 'https://images.unsplash.com/photo-1601175750527-88def4365509?w=800&auto=format&fit=crop&q=80',
      productRef: products.find(p => p.id === 'prod-02') || products[1] || products[0],
      hotspots: [
        { id: 'h6', x: 45, y: 38, title: 'Cuero Hidrofugado 2.2mm', tag: 'GORE-TEX MEMBRANE', desc: 'Impermeabilidad total y respirabilidad en marcha forzada.', stat: '100% WATERPROOF' },
        { id: 'h7', x: 65, y: 72, title: 'Suela Antideslizante Vibram', tag: 'COMPUESTO MEGAGRIP', desc: 'Tracción extrema sobre aceite, lodo y roca suelta.', stat: '+45% TRACCIÓN' },
      ],
    },
  ];

  const currentGear = gearItems[activeGearIndex];

  // Mouse move 3D tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12; // Max 12 deg tilt
    const rotateY = ((x - centerX) / centerX) * 12;

    setTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleSelectHotspot = (h: Hotspot) => {
    tacticalAudio.playLockOn();
    setActiveHotspot(activeHotspot?.id === h.id ? null : h);
  };

  const handleAddToCart = () => {
    if (currentGear.productRef) {
      tacticalAudio.playAddCart();
      addItem(currentGear.productRef, 1);
      toast.success(`"${currentGear.title}" añadido al arsenal`, {
        description: `${currentGear.price} · Despacho coordinado en Cochabamba`,
      });
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* 3D Container with high perspective */}
      <div
        className="w-full max-w-lg relative"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setIsHovered(true);
          tacticalAudio.playBlip();
        }}
        onMouseLeave={handleMouseLeave}
      >
        {/* Holographic glowing backboard */}
        <div
          className="absolute -inset-1 rounded-3xl opacity-40 blur-xl transition-all duration-500 pointer-events-none"
          style={{
            background: isHovered
              ? 'radial-gradient(circle at center, rgba(200, 169, 97, 0.4), rgba(48, 164, 108, 0.15), transparent 70%)'
              : 'radial-gradient(circle at center, rgba(200, 169, 97, 0.2), transparent 60%)',
          }}
        />

        {/* 3D Tilted Card Body */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden border border-[#C8A961]/30 bg-[#0c0c10]/95 backdrop-blur-2xl p-5 shadow-2xl transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(10px)`,
            transformStyle: 'preserve-3d',
            boxShadow: isHovered
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(200, 169, 97, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
              : '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Moving Specular Glare Reflection */}
          <div
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.35 : 0.05,
              background: `radial-gradient(circle 350px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.35), transparent 70%)`,
            }}
          />

          {/* Top HUD Telemetry Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#22222A] text-[10px] font-mono">
            <div className="flex items-center gap-2 text-[#C8A961]">
              <Shield size={12} className="animate-pulse" />
              <span className="font-bold tracking-widest">HOLO-INSPECTOR V3</span>
            </div>
            <div className="flex items-center gap-1 text-[#30A46C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C] animate-ping" />
              <span>LOCK-ON ACTIVO</span>
            </div>
          </div>

          {/* Product Image Stage with Interactive Hotspots */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#07070a] border border-[#22222A] group">
            <Image
              src={currentGear.image}
              alt={currentGear.title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-85"
              sizes="(max-width: 768px) 100vw, 450px"
            />

            {/* Subtle tactical grid inside image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-transparent opacity-80" />

            {/* Laser scanning beam */}
            <div
              className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A961] to-transparent pointer-events-none"
              style={{ animation: 'scanLine 4s linear infinite', top: 0 }}
            />

            {/* Pulsing Interactive Hotspots */}
            {currentGear.hotspots.map((h) => {
              const isSelected = activeHotspot?.id === h.id;
              return (
                <div
                  key={h.id}
                  style={{ top: `${h.y}%`, left: `${h.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => handleSelectHotspot(h)}
                    className="relative flex items-center justify-center p-2 group/btn focus:outline-none"
                    title={h.title}
                  >
                    {/* Ring pulse */}
                    <span
                      className={`absolute w-8 h-8 rounded-full border ${
                        isSelected
                          ? 'border-[#30A46C] animate-ping'
                          : 'border-[#C8A961] animate-pulse opacity-70'
                      }`}
                    />
                    <span
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#30A46C] text-black scale-110 shadow-[0_0_15px_#30A46C]'
                          : 'bg-[#0c0c10]/90 text-[#C8A961] border border-[#C8A961]/60 hover:scale-125'
                      }`}
                    >
                      <Crosshair size={13} className={isSelected ? 'animate-spin' : ''} />
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Hotspot HUD Overlay Drawer (When a hotspot is clicked) */}
            {activeHotspot && (
              <div
                className="absolute inset-x-3 bottom-3 z-30 p-3.5 rounded-xl border border-[#C8A961]/40 bg-[#09090D]/95 backdrop-blur-xl shadow-2xl animate-fade-in-up"
                style={{ transform: 'translateZ(30px)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#C8A961] uppercase block">
                      {activeHotspot.tag}
                    </span>
                    <h5 className="text-xs font-extrabold text-white uppercase">{activeHotspot.title}</h5>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#30A46C]/20 border border-[#30A46C]/40 text-[#30A46C] font-bold">
                    {activeHotspot.stat}
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-2.5">
                  {activeHotspot.desc}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#22222A]">
                  <span className="text-[10px] font-mono text-[#5E5E68]">ESPECIFICACIÓN MIL-SPEC</span>
                  <button
                    onClick={() => setActiveHotspot(null)}
                    className="text-[10px] font-mono text-[#C8A961] hover:underline"
                  >
                    [CERRAR HUD]
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product Meta & 1-Click Purchase */}
          <div className="mt-4 pt-3 border-t border-[#22222A] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-[#C8A961] uppercase tracking-wider block">
                {currentGear.category}
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1">
                {currentGear.title}
              </h4>
              <div className="text-base font-extrabold font-mono text-[#DEC07A] mt-0.5">
                {currentGear.price}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn-tactical text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-[0_4px_15px_rgba(200,169,97,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingCart size={14} />
              <span>EQUIPAR</span>
            </button>
          </div>
        </div>

        {/* Gear Selector Tabs (Under 3D Card) */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {gearItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                tacticalAudio.playBlip();
                setActiveGearIndex(idx);
                setActiveHotspot(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-200 border ${
                activeGearIndex === idx
                  ? 'bg-[#C8A961] text-black font-bold border-[#C8A961] shadow-[0_0_12px_rgba(200,169,97,0.4)]'
                  : 'bg-[#0D0D10] text-[#7A7A85] border-[#22222A] hover:border-[#35353E] hover:text-white'
              }`}
            >
              {idx === 0 ? 'CHALECO IV' : idx === 1 ? 'MIRA EOTECH' : 'BOTAS VIBRAM'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
