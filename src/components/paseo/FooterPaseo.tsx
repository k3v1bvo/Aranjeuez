'use client';

import Link from 'next/link';
import { ChakanaIcon } from './ChakanaIcon';
import { 
  MapPin, Clock, Phone, ShoppingBag, Bot, Flame, 
  QrCode, User, ClipboardList, Store, ShieldCheck, Compass, Sparkles 
} from 'lucide-react';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';

export function FooterPaseo() {
  return (
    <footer className="bg-[#030B1A] border-t border-white/10 pt-16 pb-10 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Chakana Watermark de Fondo Sutil */}
      <div className="absolute -bottom-20 -right-20 pointer-events-none opacity-[0.03]">
        <ChakanaIcon size={340} className="text-white" rotateOnHover={false} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Columna 1: Identidad y Ubicación */}
          <div className="flex flex-col items-start space-y-4">
            <PaseoAranjuezLogo size="lg" showSubtitle={false} />

            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans max-w-sm">
              El complejo comercial, gastronómico y empresarial de vanguardia en Cochabamba. Compras con retiro express, atención inteligente y beneficios en cada visita.
            </p>

            <div className="space-y-2.5 pt-1 text-xs text-white/70">
              <a 
                href="https://maps.google.com/?q=Paseo+Aranjuez+Cochabamba" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-2 text-white/70 hover:text-[#FF6B1A] transition-colors group"
                title="Ver ubicación en Google Maps"
              >
                <MapPin className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>
                  Av. América Este & Calle Pantaleón Dalence<br />
                  <strong className="text-white/90 font-medium">Zona Aranjuez · Cochabamba, Bolivia</strong>
                </span>
              </a>

              <div className="flex items-center gap-2 text-white/60">
                <Phone className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                <span>+591 4 445-0000 · Concierge & Atención</span>
              </div>
            </div>
          </div>

          {/* Columna 2: Horarios de Atención */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A24C]" />
              Horarios Oficiales
            </h4>
            <div className="space-y-2 text-xs font-sans">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Comercios & Tiendas</span>
                <span className="font-bold text-white font-mono">10:00 - 21:00</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Gastronomía & Terrazas</span>
                <span className="font-bold text-[#FF6B1A] font-mono">11:00 - 23:00</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Torre Empresarial</span>
                <span className="font-bold text-white/90 font-mono">08:00 - 20:00</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Estacionamiento</span>
                <span className="font-bold text-[#D4A24C] font-mono">24 Horas</span>
              </div>
            </div>
          </div>

          {/* Columna 3: Módulos de la Plataforma */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B1A]" />
              Módulos Digitales
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link 
                  href="/cliente" 
                  className="flex items-center gap-2 text-white/70 hover:text-[#FF6B1A] transition-colors py-1 group"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#FF6B1A] group-hover:translate-x-0.5 transition-transform" />
                  <span>PaseoYa (Marketplace & Retiro)</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/jarvis" 
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4A24C] transition-colors py-1 group"
                >
                  <Bot className="w-3.5 h-3.5 text-[#D4A24C] group-hover:translate-x-0.5 transition-transform" />
                  <span>Jarvis (Asistente IA Concierge)</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/cliente/puntos" 
                  className="flex items-center gap-2 text-white/70 hover:text-[#FF8F4D] transition-colors py-1 group"
                >
                  <Flame className="w-3.5 h-3.5 text-[#FF8F4D] group-hover:translate-x-0.5 transition-transform" />
                  <span>Paseo Points (Beneficios & Canjes)</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/cliente/perfil" 
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-1 group"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#7A8B5C] group-hover:translate-x-0.5 transition-transform" />
                  <span>Credencial QR Personal</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/#espacios" 
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-1 group"
                >
                  <Compass className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-0.5 transition-transform" />
                  <span>Directorio de Locales & Espacios</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Accesos Rápidos & Cuenta */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7A8B5C]" />
              Mi Cuenta & Gestión
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link 
                  href="/cliente/perfil" 
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-1 group"
                >
                  <User className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                  <span>Mi Perfil & Datos</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/cliente/pedidos" 
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-1 group"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-[#D4A24C] group-hover:translate-x-0.5 transition-transform" />
                  <span>Mis Pedidos Click & Collect</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/comercio" 
                  className="flex items-center gap-2 text-white/70 hover:text-[#FF6B1A] transition-colors py-1 group"
                >
                  <Store className="w-3.5 h-3.5 text-[#FF6B1A] group-hover:translate-x-0.5 transition-transform" />
                  <span>Portal Locatarios (Comercio & Caja)</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/overview" 
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4A24C] transition-colors py-1 group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4A24C] group-hover:translate-x-0.5 transition-transform" />
                  <span>Administración Central (Mall)</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/qrs" 
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-1 group"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#FF8F4D] group-hover:translate-x-0.5 transition-transform" />
                  <span>Tótems & Puntos por Piso</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Barra Inferior de Créditos y Certificación */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4 font-sans">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© 2026 Paseo Aranjuez. Cochabamba, Bolivia.</p>
            <span className="hidden sm:inline text-white/20">|</span>
            <p className="text-white/40">Arquitectura: Arq. Daniel Enríquez Espinoza</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70 font-medium">Plataforma Digital Segura</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
