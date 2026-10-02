'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { TacticalRadarCanvas } from '@/components/TacticalRadarCanvas';
import { HoloGearShowcase } from '@/components/HoloGearShowcase';
import { TacticalDeliverySimulator } from '@/components/TacticalDeliverySimulator';
import { TacticalPaymentSimulator } from '@/components/TacticalPaymentSimulator';
import { TiltProductCard } from '@/components/TiltProductCard';
import { tacticalAudio } from '@/lib/tactical-audio';
import {
  Shield,
  Crosshair,
  ArrowRight,
  Package,
  Award,
  Truck,
  CheckCircle2,
  Star,
  Search,
  ChevronRight,
  ShoppingCart,
  Radio,
  Lock,
  Cpu,
  Flame,
  Layers,
  Sparkles,
  Store,
  Building,
  Target,
  Zap,
  MapPin,
  Clock,
  Gift,
  Volume2,
  VolumeX,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

// ============ SCROLL REVEAL HOOK ============
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

// ============ GSAP HERO ANIMATIONS ============
function useHeroAnimation(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let gsapCtx: any;

    const initGSAP = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      gsapCtx = gsap.context(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.fromTo('[data-hero-badge]', { opacity: 0, y: -16, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 })
          .fromTo('[data-hero-h1]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
          .fromTo('[data-hero-sub]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
          .fromTo('[data-hero-actions]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
          .fromTo('[data-hero-stats]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.2');

        // Progress bars animation triggered on scroll
        ScrollTrigger.batch('[data-progress-bar]', {
          onEnter: (elements) => {
            elements.forEach((el: Element) => {
              const target = (el as HTMLElement).dataset.width || '0';
              gsap.fromTo(el, { width: '0%' }, { width: `${target}%`, duration: 1.4, ease: 'power2.out' });
            });
          },
          once: true,
        });
      }, containerRef);
    };

    initGSAP();
    return () => gsapCtx?.revert();
  }, [containerRef]);
}

// ============ MAIN HOME PAGE ============
export default function HomePage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { products, categories } = useStore();
  const heroRef = useRef<HTMLElement>(null);

  // Vision Mode: 'stealth' | 'nvg' | 'flir'
  const [visionMode, setVisionMode] = useState<'stealth' | 'nvg' | 'flir'>('stealth');
  const [audioActive, setAudioActive] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'stock'>('featured');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Active products
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.is_active && !p.deleted_at);
  }, [products]);

  // Featured flagship product
  const flagshipProduct = useMemo(() => {
    return activeProducts.find((p) => p.stock > 0) || activeProducts[0];
  }, [activeProducts]);

  // Filtered products for catalog
  const filteredProducts = useMemo(() => {
    let list = [...activeProducts];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'stock':
        list.sort((a, b) => b.stock - a.stock);
        break;
    }

    return list;
  }, [activeProducts, search, selectedCategory, sortBy]);

  // Init hooks
  useScrollReveal();
  useHeroAnimation(heroRef);

  // Handle Vision Mode Switch
  const handleSwitchVision = (mode: 'stealth' | 'nvg' | 'flir') => {
    tacticalAudio.playVisionSwitch();
    setVisionMode(mode);
    toast(`MODO VISOR ACTIVADO: ${mode.toUpperCase()}`, {
      description: mode === 'nvg' ? 'Visión Nocturna Fósforo Verde STANAG' : mode === 'flir' ? 'Infrarrojo Térmico FLIR' : 'Firma Sigilosa Mate Oro',
    });
  };

  // Handle Audio Toggle
  const handleToggleAudio = () => {
    const isEnabled = tacticalAudio.toggle();
    setAudioActive(isEnabled);
    toast(isEnabled ? 'AUDIO TÁCTICO HUD: ACTIVADO' : 'AUDIO HUD: SILENCIADO', {
      description: isEnabled ? 'Sintetizador Web Audio operativo' : 'Efectos acústicos desactivados',
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    tacticalAudio.playAddCart();
    setNewsletterSubscribed(true);
    toast.success('¡Registro táctico completado!', {
      description: 'Recibirás notificaciones de drops prioritarios.',
    });
  };

  const categoryImages: Record<string, string> = {
    'cat-01': 'https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80',
    'cat-02': 'https://images.unsplash.com/photo-1601175750527-88def4365509?w=800&auto=format&fit=crop&q=80',
    'cat-03': 'https://images.unsplash.com/photo-1784612212663-716f0518783d?w=800&auto=format&fit=crop&q=80',
    'cat-04': 'https://images.unsplash.com/photo-1707264848832-a1de98edb85c?w=800&auto=format&fit=crop&q=80',
    'cat-05': 'https://images.unsplash.com/photo-1566566716921-b50e82140547?w=800&auto=format&fit=crop&q=80',
    'cat-06': 'https://images.unsplash.com/photo-1773875342538-a45969eb78e5?w=800&auto=format&fit=crop&q=80',
    'cat-07': 'https://images.unsplash.com/photo-1576420469891-b303889e81bf?w=800&auto=format&fit=crop&q=80',
    'cat-08': 'https://images.unsplash.com/photo-1776687773939-348819a9b787?w=800&auto=format&fit=crop&q=80',
  };

  return (
    <div
      className={`min-h-screen bg-[#050507] text-[#F5F5F7] selection:bg-[#C8A961] selection:text-[#050507] overflow-x-hidden ${
        visionMode === 'nvg' ? 'vision-nvg' : visionMode === 'flir' ? 'vision-flir' : ''
      }`}
    >
      <Navbar />

      {/* ================================================================= */}
      {/* HERO SECTION 3.0 — Cinematic Tactical Command & 3D Arsenal          */}
      {/* ================================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden hero-gradient"
      >
        {/* Interactive 60fps Radar Canvas Background */}
        <TacticalRadarCanvas visionMode={visionMode} />

        {/* Ambient Glow Orbs */}
        <div
          className="glow-orb glow-orb-gold absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[550px] opacity-40 pointer-events-none"
          style={{ animation: 'orbFloat 22s ease-in-out infinite' }}
        />

        {/* CRT Scanline Overlay if in NVG mode */}
        {visionMode === 'nvg' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06)_0%,transparent_75%)] pointer-events-none z-10 scanlines" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
          {/* Top HUD Controls: Vision Modes & Audio Equalizer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-3 border-b border-[#22222A]/60">
            {/* Left: Location & Sat-Link */}
            <div className="flex items-center gap-3 text-[10px] font-mono text-[#5E5E68]">
              <span className="flex items-center gap-1.5 text-[#C8A961] font-bold">
                <Radio size={12} className="animate-pulse" /> SAT-LINK ONLINE
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">COCHABAMBA 17°23&apos;S 66°09&apos;W</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline text-[#30A46C] font-bold">18 OPERADORES EN LÍNEA</span>
            </div>

            {/* Right: Vision Switcher & Audio Equalizer */}
            <div className="flex items-center gap-2">
              {/* Audio HUD Toggle with Equalizer Bars */}
              <button
                onClick={handleToggleAudio}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-2 transition-all ${
                  audioActive
                    ? 'bg-[#30A46C]/15 border-[#30A46C] text-[#30A46C] shadow-[0_0_12px_rgba(48,164,108,0.3)]'
                    : 'bg-[#111116] border-[#22222A] text-[#7A7A85] hover:text-white'
                }`}
                title="Activar / Desactivar Sonidos Tácticos HUD"
              >
                {audioActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span className="font-bold">{audioActive ? 'AUDIO ACTIVO' : 'AUDIO HUD'}</span>
                {audioActive && (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#30A46C] rounded-full animate-eq-1" />
                    <span className="w-0.5 bg-[#30A46C] rounded-full animate-eq-2" />
                    <span className="w-0.5 bg-[#30A46C] rounded-full animate-eq-3" />
                    <span className="w-0.5 bg-[#30A46C] rounded-full animate-eq-4" />
                  </div>
                )}
              </button>

              {/* Vision Mode Selector */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#111116] border border-[#22222A] text-[10px] font-mono">
                <button
                  onClick={() => handleSwitchVision('stealth')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    visionMode === 'stealth'
                      ? 'bg-[#C8A961] text-black font-extrabold shadow-sm'
                      : 'text-[#7A7A85] hover:text-white'
                  }`}
                >
                  ORO SIGILO
                </button>
                <button
                  onClick={() => handleSwitchVision('nvg')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    visionMode === 'nvg'
                      ? 'bg-[#22c55e] text-black font-extrabold shadow-[0_0_10px_#22c55e]'
                      : 'text-[#7A7A85] hover:text-[#22c55e]'
                  }`}
                >
                  NVG VERDE
                </button>
                <button
                  onClick={() => handleSwitchVision('flir')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    visionMode === 'flir'
                      ? 'bg-[#06b6d4] text-black font-extrabold shadow-[0_0_10px_#06b6d4]'
                      : 'text-[#7A7A85] hover:text-[#06b6d4]'
                  }`}
                >
                  TÉRMICO
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Hero Stage: Tactical Command & 3D Arsenal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Mission Briefing & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div
                data-hero-badge
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-surface border border-[#C8A961]/30 text-xs shadow-xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#C8A961] animate-pulse" />
                <span className="font-mono text-[11px] text-[#A1A1AA] tracking-widest uppercase">
                  Base Central Cochabamba · Av. Heroínas #560
                </span>
                <span className="text-[#35353E]">·</span>
                <span className="text-[#C8A961] font-mono text-[11px] font-bold">EDICIÓN 2026</span>
              </div>

              {/* Headline */}
              <h1
                data-hero-h1
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F5F5F7] uppercase font-sans leading-[1.05]"
              >
                EQUIPO PARA{' '}
                <br />
                <span className="text-glow-gold text-gradient-gold">
                  NO DETENERSE
                </span>
              </h1>

              {/* Subtitle */}
              <p
                data-hero-sub
                className="text-sm sm:text-base md:text-lg text-[#7A7A85] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
              >
                Ingeniería militar, protección balística NIJ-IV y ergonomía de precisión.
                Despacho inmediato en Cochabamba y envíos diarios por flota a toda Bolivia.
              </p>

              {/* CTAs */}
              <div
                data-hero-actions
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <a
                  href="#catalogo"
                  className="btn-tactical text-sm px-8 py-4 w-full sm:w-auto shadow-2xl flex items-center justify-center gap-2"
                >
                  <span>EXPLORAR ARSENAL</span> <ArrowRight size={16} />
                </a>
                <a
                  href="#simulador-envios"
                  className="btn-outline-gold text-sm px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Truck size={16} />
                  <span>SIMULADOR DE ENVÍOS</span>
                </a>
              </div>

              {/* Metrics Micro-Strip */}
              <div
                data-hero-stats
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#22222A]"
              >
                {[
                  { label: 'MIL-SPEC', sub: 'Certificado NIJ', color: '#F5F5F7' },
                  { label: '< 2 HORAS', sub: 'Cercado Express', color: '#C8A961' },
                  { label: 'TERMINAL', sub: 'Flota Toda Bolivia', color: '#F5F5F7' },
                  { label: 'QR SIMPLE', sub: 'Liquidación 0 Clics', color: '#30A46C' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#0e0e13]/60 border border-[#22222A] text-center group cursor-default hover:border-[#C8A961]/30 transition-colors"
                  >
                    <div
                      className="text-lg font-bold font-mono transition-transform duration-300 group-hover:scale-105"
                      style={{ color: m.color }}
                    >
                      {m.label}
                    </div>
                    <div className="text-[10px] text-[#5E5E68] uppercase tracking-wider mt-0.5 font-mono">
                      {m.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: 3D HOLOGRAPHIC GEAR SHOWCASE (Interactive Hotspots) */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <HoloGearShowcase products={activeProducts} />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono tracking-widest text-[#5E5E68] uppercase">DESPLAZAR</span>
          <div className="w-4 h-7 rounded-full border border-[#35353E] flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-[#C8A961] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* TRUST TICKER                                                        */}
      {/* ================================================================= */}
      <section className="py-3.5 border-y border-[#22222A] bg-[#0A0A0D] overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0D] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0D] to-transparent z-10 pointer-events-none" />
        <div className="animate-marquee flex items-center gap-10 text-xs font-mono tracking-widest text-[#5E5E68] uppercase">
          {[1, 2].map((i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2 hover:text-[#C8A961] transition-colors cursor-default whitespace-nowrap">
                <Store size={13} className="text-[#C8A961] flex-shrink-0" />
                BASE CENTRAL COCHABAMBA · RETIRO GRATUITO (HEROÍNAS #560)
              </span>
              <span className="text-[#22222A] flex-shrink-0">✦</span>
              <span className="flex items-center gap-2 hover:text-[#C8A961] transition-colors cursor-default whitespace-nowrap">
                <Truck size={13} className="text-[#C8A961] flex-shrink-0" />
                DELIVERY MOTORIZADO EXPRESS · CERCADO · SACABA · QUILLACOLLO
              </span>
              <span className="text-[#22222A] flex-shrink-0">✦</span>
              <span className="flex items-center gap-2 hover:text-[#C8A961] transition-colors cursor-default whitespace-nowrap">
                <Building size={13} className="text-[#C8A961] flex-shrink-0" />
                DESPACHO FLOTA DIARIO A TODA BOLIVIA
              </span>
              <span className="text-[#22222A] flex-shrink-0">✦</span>
              <span className="flex items-center gap-2 hover:text-[#30A46C] transition-colors cursor-default whitespace-nowrap">
                <Gift size={13} className="text-[#30A46C] flex-shrink-0" />
                SOUVENIR TÁCTICO GRATIS AL ABONAR 100% QR
              </span>
              <span className="text-[#22222A] flex-shrink-0">✦</span>
              <span className="flex items-center gap-2 hover:text-[#C8A961] transition-colors cursor-default whitespace-nowrap">
                <Shield size={13} className="text-[#C8A961] flex-shrink-0" />
                GARANTÍA DE OPERACIÓN MIL-SPEC STANAG
              </span>
              <span className="text-[#22222A] flex-shrink-0">✦</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* INTERACTIVE DELIVERY SIMULATOR — Cochabamba & Nacional             */}
      {/* ================================================================= */}
      <section id="simulador-envios" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="text-center mb-12 animate-on-scroll">
          <div className="text-xs font-mono text-[#C8A961] tracking-widest uppercase mb-2">
            DESPLIEGUE TÁCTICO & COBERTURA
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            LOGÍSTICA INMEDIATA EN BOLIVIA
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7A85] mt-2 max-w-xl mx-auto">
            Calcula el tiempo y tarifa exacta para retiro en tienda, motorizado urbano o despacho por flota.
          </p>
        </div>

        <div className="animate-on-scroll">
          <TacticalDeliverySimulator />
        </div>
      </section>

      {/* ================================================================= */}
      {/* CATEGORÍAS TÁCTICAS — 3D Visual Grid                              */}
      {/* ================================================================= */}
      <section className="py-20 border-t border-[#22222A] bg-[#070709]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 animate-on-scroll">
            <div>
              <div className="text-xs font-mono text-[#C8A961] tracking-widest uppercase mb-2">
                ARSENAL POR DIVISIONES
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                CATEGORÍAS DE OPERACIÓN
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#7A7A85] max-w-md">
              Protección balística, visión nocturna, calzado de combate y herramientas EDC de supervivencia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, index) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              const bgImg =
                categoryImages[cat.id] ||
                'https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80';

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    tacticalAudio.playLockOn();
                    setSelectedCategory(cat.id);
                    const el = document.getElementById('catalogo');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="animate-on-scroll group relative h-80 rounded-2xl overflow-hidden cursor-pointer iso-card"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <Image
                    src={bgImg}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-60"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C8A961]/0 via-transparent to-[#050507]/80 group-hover:from-[#C8A961]/10 transition-all duration-500" />
                  <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-[#C8A961]/40 transition-colors duration-300" />

                  {/* Index tag */}
                  <div className="absolute top-4 right-4 text-[#5E5E68] group-hover:text-[#C8A961] font-mono text-[11px] transition-colors duration-300 tracking-widest">
                    DIV-{String(index + 1).padStart(2, '0')} ──
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                    <span className="text-[11px] font-mono text-[#C8A961] uppercase tracking-wider font-semibold mb-1">
                      {count} ÍTEMS DISPONIBLES
                    </span>
                    <h3 className="text-xl font-extrabold text-white uppercase tracking-tight mb-1.5 group-hover:text-[#C8A961] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#7A7A85] line-clamp-2 mb-4 leading-relaxed">
                      {cat.description || 'Equipamiento de máxima resistencia y ergonomía para operaciones exigentes.'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 group-hover:text-[#C8A961] uppercase tracking-wider transition-all duration-300">
                      EXPLORAR LÍNEA <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* CATÁLOGO DE PRODUCTOS — 3D Tilt Cards                              */}
      {/* ================================================================= */}
      <section id="catalogo" className="py-24 border-t border-[#22222A] bg-[#050507] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 animate-on-scroll">
            <div>
              <div className="text-xs font-mono text-[#C8A961] tracking-widest uppercase mb-2">
                INVENTARIO OPERATIVO EN VIVO
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                CATÁLOGO TÁCTICO
              </h2>
            </div>
            <div className="text-xs font-mono text-[#5E5E68] bg-[#0D0D10] border border-[#22222A] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-pulse" />
              <span>{filteredProducts.length} ÍTEMS LISTOS PARA DESPACHO</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-card-static p-4 rounded-2xl border border-[#22222A] mb-8 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between animate-on-scroll">
            {/* Search input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E5E68]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por arma, código, calibre o descripción..."
                className="w-full bg-[#0D0D10] border border-[#22222A] text-xs text-[#F5F5F7] rounded-xl pl-10 pr-4 py-2.5 focus:border-[#C8A961]/50 focus:outline-none font-mono placeholder-[#5E5E68]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar touch-pan-x">
              <button
                onClick={() => {
                  tacticalAudio.playBlip();
                  setSelectedCategory(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-[#C8A961] text-black font-extrabold shadow-[0_0_15px_rgba(200,169,97,0.35)]'
                    : 'bg-[#0D0D10] text-[#A1A1AA] hover:text-white border border-[#22222A]'
                }`}
              >
                TODOS ({activeProducts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    tacticalAudio.playBlip();
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#C8A961] text-black font-extrabold shadow-[0_0_15px_rgba(200,169,97,0.35)]'
                      : 'bg-[#0D0D10] text-[#A1A1AA] hover:text-white border border-[#22222A]'
                  }`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0D0D10] border border-[#22222A] text-xs text-[#A1A1AA] rounded-xl px-3 py-2.5 focus:border-[#C8A961]/50 focus:outline-none cursor-pointer font-mono"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="stock">Mayor Disponibilidad</option>
            </select>
          </div>

          {/* 3D Tilt Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="animate-on-scroll">
                <TiltProductCard product={product} />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-24 border border-dashed border-[#22222A] rounded-2xl">
              <Target size={40} className="text-[#5E5E68] mx-auto mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-1">Sin coincidencias tácticas</h3>
              <p className="text-xs text-[#7A7A85]">Intenta con otra palabra clave o restablece filtros.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory(null);
                }}
                className="btn-tactical text-xs mt-5"
              >
                Restablecer Búsqueda
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* VALOR TÁCTICO & MATRIZ DE RESISTENCIA BALÍSTICA                   */}
      {/* ================================================================= */}
      <section id="bloque-valor" className="py-24 border-t border-[#22222A] bg-[#070709]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Features */}
            <div className="animate-on-scroll">
              <div className="text-xs font-mono text-[#C8A961] tracking-widest uppercase mb-2">
                ESPECIFICACIONES SIN CONCESIONES
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase mb-6 leading-tight">
                ESTÁNDARES MILITARES PARA OPERACIONES CRÍTICAS
              </h2>
              <p className="text-sm text-[#7A7A85] mb-10 leading-relaxed">
                Cada costura, hebilla y placa de blindaje es sometida a rigurosos ensayos de tensión, tracción balística y sellado hidrofóbico antes de ingresar a nuestro arsenal.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Shield, title: 'Blindaje & Cerámica NIJ-IV', desc: 'Detención de proyectiles perforantes hasta 7.62x51mm OTAN con mínima deformación posterior.' },
                  { icon: Layers, title: 'Cordura 1000D Láser-Cut', desc: 'Tejido balístico con ranurado de corte láser. 30% más ligero y 100% impermeable.' },
                  { icon: Flame, title: 'Resistencia Térmica IP68', desc: 'Operación continua entre -40°C y +70°C con sellado hermético contra polvo fino y agua.' },
                  { icon: Cpu, title: 'Hebillas Cobra 7075-T6', desc: 'Aluminio aeroespacial fresado en CNC con resistencia comprobada superior a 900 kg.' },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 group animate-on-scroll"
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#0D0D10] border border-[#22222A] flex items-center justify-center text-[#C8A961] flex-shrink-0 mt-0.5 group-hover:border-[#C8A961]/40 group-hover:bg-[#C8A961]/10 transition-all duration-300">
                      <f.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-1">{f.title}</h4>
                      <p className="text-xs text-[#7A7A85] leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Telemetry HUD */}
            <div className="relative glass-card p-8 overflow-hidden tactical-dots-bg animate-on-scroll">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-mono text-[#5E5E68]">
                <Lock size={11} className="text-[#30A46C]" /> TELEMETRÍA ENCRIPTADA
              </div>

              <div className="mb-6">
                <span className="text-[10px] font-mono text-[#C8A961] uppercase font-bold">DIAGNÓSTICO EN VIVO</span>
                <h3 className="text-xl font-bold text-white mt-1">MATRIZ DE RESISTENCIA BALÍSTICA</h3>
              </div>

              {/* Radar Graphic */}
              <div className="relative w-56 h-56 mx-auto my-6 flex items-center justify-center">
                {[56, 44, 32].map((size, i) => (
                  <div
                    key={i}
                    className={`absolute border rounded-full ${
                      i === 0 ? 'border-[#35353E]' : i === 1 ? 'border-[#22222A]' : 'border-[#C8A961]/25'
                    }`}
                    style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                  />
                ))}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#22222A]" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#22222A]" />
                <div
                  className="absolute w-[1px] h-1/2 bg-gradient-to-t from-[#C8A961]/70 to-transparent origin-bottom animate-radar"
                  style={{ bottom: '50%', left: '50%', transformOrigin: 'bottom center' }}
                />
                <Crosshair size={32} className="text-[#C8A961] relative z-10 animate-pulse" />
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 font-mono text-xs mt-6">
                {[
                  { label: 'DURABILIDAD A LA ABRASIÓN (CORDURA 1000D)', value: 99.4 },
                  { label: 'DISPERSIÓN DE IMPACTO CINÉTICO', value: 96.8 },
                  { label: 'REDUCCIÓN FIRMA INFRARROJA (NIR)', value: 94.2 },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                      <span>{bar.label}</span>
                      <span className="text-[#C8A961] font-bold">{bar.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0D0D10] rounded-full overflow-hidden border border-[#22222A]">
                      <div
                        data-progress-bar
                        data-width={bar.value}
                        className="h-full bg-gradient-to-r from-[#C8A961] to-[#DEC07A] rounded-full"
                        style={{ width: `${bar.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* INTERACTIVE PAYMENT SIMULATOR — QR 100% / 50-50 / Contraentrega  */}
      {/* ================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="animate-on-scroll">
          <TacticalPaymentSimulator />
        </div>
      </section>

      {/* ================================================================= */}
      {/* TESTIMONIOS DE OPERADORES                                           */}
      {/* ================================================================= */}
      <section className="py-24 border-t border-[#22222A] bg-[#070709]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-on-scroll">
            <div className="text-xs font-mono text-[#C8A961] tracking-widest uppercase mb-2">
              AVALADO EN EL CAMPO OPERATIVO
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
              TESTIMONIOS DE OPERADORES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                initials: 'MR',
                name: 'Mayor Roberto V.',
                role: 'Unidad de Operaciones Especiales (Cochabamba)',
                review: '"El plate carrier Nivel IV resistió 3 semanas continuas de despliegue en bosque húmedo sin una sola costura cedida."',
              },
              {
                initials: 'DC',
                name: 'Dra. Claudia M.',
                role: 'Rescate Alpino & Trauma (La Paz)',
                review: '"La mochila táctica 45L nos permitió cargar 2 desfibriladores y material de trauma sin pérdida de movilidad en ascenso vertical."',
              },
              {
                initials: 'JS',
                name: 'Javier S.',
                role: 'Instructor de Tiro Defensivo (Santa Cruz)',
                review: '"El pago con QR Simple y la verificación inmediata fue excelente. Recibí el paquete por flota con empaque sellado al vacío y el souvenir táctico de regalo."',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="glass-card p-6 flex flex-col justify-between group hover:border-[#C8A961]/30 animate-on-scroll"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div>
                  <div className="flex items-center gap-1 text-[#C8A961] mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} fill="#C8A961" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed italic mb-6">{t.review}</p>
                </div>
                <div className="pt-4 border-t border-[#22222A] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0D0D10] border border-[#C8A961]/25 flex items-center justify-center font-mono font-bold text-[#C8A961] text-xs group-hover:border-[#C8A961]/50 transition-colors">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {t.name} <CheckCircle2 size={12} className="text-[#30A46C]" />
                    </div>
                    <div className="text-[10px] text-[#5E5E68] font-mono">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FLAGSHIP PRODUCT SPOTLIGHT                                          */}
      {/* ================================================================= */}
      {flagshipProduct && (
        <section className="py-20 border-t border-[#22222A] bg-[#050507] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div
              className="rounded-3xl border border-[#35353E] p-8 md:p-12 relative overflow-hidden animate-on-scroll"
              style={{
                background: 'linear-gradient(135deg, rgba(15,15,20,0.95) 0%, rgba(22,22,30,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8A961]/50 to-transparent" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C8A961]/10 text-[#C8A961] border border-[#C8A961]/30 text-xs font-mono font-bold">
                    <Sparkles size={11} /> PRODUCTO INSIGNIA DE TEMPORADA
                  </span>

                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-tight">
                    {flagshipProduct.name}
                  </h3>

                  <p className="text-sm text-[#7A7A85] max-w-xl leading-relaxed">
                    {flagshipProduct.description}
                  </p>

                  <div className="flex items-center gap-6 py-2 font-mono">
                    <div>
                      <div className="text-[10px] text-[#5E5E68]">PRECIO DIRECTO</div>
                      <div className="text-3xl font-extrabold text-white text-glow-gold">
                        Bs. {flagshipProduct.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="h-8 w-[1px] bg-[#22222A]" />
                    <div>
                      <div className="text-[10px] text-[#5E5E68]">DISPONIBILIDAD</div>
                      <div className="text-sm font-bold text-[#30A46C] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-pulse" />
                        {flagshipProduct.stock > 0 ? `${flagshipProduct.stock} UDS EN ALMACÉN` : 'AGOTADO'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => {
                        tacticalAudio.playAddCart();
                        addItem(flagshipProduct, 1);
                        router.push('/checkout');
                      }}
                      className="btn-tactical text-xs px-8 py-3.5 flex items-center gap-2"
                    >
                      <ShoppingCart size={15} />
                      <span>ORDENAR INMEDIATO</span>
                    </button>
                    <button
                      onClick={() => router.push(`/producto/${flagshipProduct.id}`)}
                      className="btn-outline-gold text-xs px-8 py-3.5"
                    >
                      VER FICHA TÉCNICA
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-[#22222A] bg-[#0A0A0D] group">
                  <Image
                    src={flagshipProduct.images[0] || 'https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80'}
                    alt={flagshipProduct.name}
                    fill
                    className="object-cover group-hover:scale-108 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* CANAL DE DESPLIEGUE — Newsletter                                    */}
      {/* ================================================================= */}
      <section className="py-24 border-t border-[#22222A] bg-[#070709] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-on-scroll">
          <div className="w-14 h-14 rounded-2xl bg-[#C8A961]/10 border border-[#C8A961]/25 flex items-center justify-center text-[#C8A961] mx-auto mb-5 animate-float">
            <Radio size={24} />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase mb-3">
            ÚNETE AL CANAL DE DESPLIEGUE
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7A85] max-w-lg mx-auto mb-8 leading-relaxed">
            Alertas prioritarias de reabastecimiento, lotes balísticos confidenciales y descuentos para operadores en Bolivia.
          </p>

          {newsletterSubscribed ? (
            <div className="p-4 rounded-xl bg-[#30A46C]/10 border border-[#30A46C]/25 text-[#30A46C] text-xs font-mono font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
              <CheckCircle2 size={16} /> OPERADOR ENLAZADO AL CANAL DE DESPACHO
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="operador@tacticos.bo"
                className="flex-1 bg-[#0D0D10] border border-[#22222A] rounded-xl px-5 py-3.5 text-xs text-white placeholder-[#5E5E68] focus:border-[#C8A961]/50 focus:outline-none font-mono transition-all"
              />
              <button type="submit" className="btn-tactical text-xs py-3.5 px-6 whitespace-nowrap">
                ENROLARSE
              </button>
            </form>
          )}

          <div className="text-[10px] text-[#5E5E68] font-mono mt-4">
            SIN SPAM · PROTOCOLO DE PRIVACIDAD MIL-STD · DESUSCRIPCIÓN CON 1 CLIC
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FOOTER                                                              */}
      {/* ================================================================= */}
      <footer className="border-t border-[#22222A] bg-[#030305] pt-16 pb-28 sm:pb-12 relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8A961]/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand HQ */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-[#C8A961]" />
                <span className="font-mono font-extrabold text-white text-base tracking-wider">
                  TÁCTICOS<span className="text-[#C8A961]">.PRO</span>
                </span>
              </div>
              <p className="text-xs text-[#5E5E68] leading-relaxed">
                Base central en Cochabamba, Bolivia (Av. Heroínas #560). Retiro gratuito en almacén, delivery motorizado urbano y despachos por flota a todo el país.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#30A46C] bg-[#0D0D10] px-3 py-1.5 rounded-lg border border-[#22222A] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C] animate-ping" />
                HQ COCHABAMBA OPERATIVO
              </div>
            </div>

            {/* Arsenal links */}
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">ARSENAL</div>
              <ul className="space-y-2 text-xs text-[#7A7A85]">
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#C8A961] transition-colors text-left"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logistics & Support */}
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">SOPORTE</div>
              <ul className="space-y-2 text-xs text-[#7A7A85]">
                <li><Link href="/ordenes" className="hover:text-[#C8A961] transition-colors">Seguimiento de Órdenes</Link></li>
                <li><a href="#simulador-envios" className="hover:text-[#C8A961] transition-colors">Tarifas de Delivery</a></li>
                <li><a href="#bloque-valor" className="hover:text-[#C8A961] transition-colors">Certificados Balísticos</a></li>
                <li><Link href="/admin/overview" className="hover:text-[#C8A961] transition-colors">Consola de Mando</Link></li>
              </ul>
            </div>

            {/* QR Simple Bolivia */}
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">PAGO CON QR BOLIVIA</div>
              <p className="text-xs text-[#5E5E68] mb-3 leading-relaxed">
                Liquidación bancaria instantánea. Sin comisiones extra para el cliente.
              </p>
              <div className="flex flex-wrap gap-2">
                {['SIMPLE QR', 'BNB', 'BCP', 'BANCO UNIÓN'].map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-[#0D0D10] border border-[#22222A] text-[10px] font-mono text-[#7A7A85]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#22222A] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5E5E68] font-mono gap-3">
            <div>© 2026 TIENDA TÁCTICA COCHABAMBA · BOLIVIA</div>
            <div className="flex items-center gap-5">
              <span>STANAG 4569</span>
              <span>CORDURA® VERIFIED</span>
              <span>AES-256 SSL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
