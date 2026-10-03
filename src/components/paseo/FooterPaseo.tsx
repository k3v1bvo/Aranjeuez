'use client';

import { MapPin, Clock } from 'lucide-react';

import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';

export function FooterPaseo() {
  return (
    <footer className="bg-[#030B1A] border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Logo y Dirección */}
          <div className="md:col-span-2 flex flex-col items-start">
            <div className="mb-4">
              <PaseoAranjuezLogo size="lg" showSubtitle={true} />
            </div>

            <p className="text-sm text-white/60 max-w-sm mb-6 font-sans">
              El complejo comercial, gastronómico y empresarial de vanguardia en Cochabamba, Bolivia. Retiro inmediato, atención inteligente y beneficios en cada visita.
            </p>

            <div className="flex items-center gap-2 text-xs text-white/70">
              <MapPin className="w-4 h-4 text-[#FF6B1A]" />
              <span>Av. América y Pando, Zona Aranjuez · Cochabamba</span>
            </div>
          </div>

          {/* Horarios de Atención */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A24C]" />
              Horarios
            </h4>
            <ul className="space-y-2 text-xs text-white/60 font-sans">
              <li className="flex justify-between">
                <span>Comercios:</span>
                <strong className="text-white">10:00 - 21:00</strong>
              </li>
              <li className="flex justify-between">
                <span>Gastronomía:</span>
                <strong className="text-white">11:00 - 23:00</strong>
              </li>
              <li className="flex justify-between">
                <span>Torre Empresarial:</span>
                <strong className="text-white">08:00 - 20:00</strong>
              </li>
              <li className="flex justify-between">
                <span>Estacionamiento:</span>
                <strong className="text-white">24 Horas</strong>
              </li>
            </ul>
          </div>

          {/* Módulos de la Plataforma */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display mb-4">
              Módulos
            </h4>
            <ul className="space-y-2 text-xs text-white/60 font-sans">
              <li>PaseoYa (Marketplace)</li>
              <li>Jarvis (Asistente Virtual)</li>
              <li>Paseo Points (Beneficios)</li>
              <li>Credencial QR Personal</li>
              <li>Directorio de Locales</li>
            </ul>
          </div>

        </div>

        {/* Créditos */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <p>© 2026 Paseo Aranjuez. Cochabamba, Bolivia.</p>
          <p className="flex items-center gap-1.5">
            <span>Paseo Aranjuez</span>
            <span className="text-[#FF6B1A] font-bold">Plataforma Digital</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
