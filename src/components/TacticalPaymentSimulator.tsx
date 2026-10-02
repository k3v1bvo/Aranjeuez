'use client';

import React, { useState } from 'react';
import { Gift, Zap, Shield, QrCode, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { tacticalAudio } from '@/lib/tactical-audio';

export function TacticalPaymentSimulator() {
  const [selectedMode, setSelectedMode] = useState<'full' | 'split' | 'delivery'>('full');

  const handleSelect = (mode: 'full' | 'split' | 'delivery') => {
    tacticalAudio.playLockOn();
    setSelectedMode(mode);
  };

  return (
    <div className="w-full rounded-3xl border border-[#22222A] bg-[#09090D]/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C8A961]/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8A961]/10 border border-[#C8A961]/25 text-[#C8A961] text-xs font-mono font-bold mb-3">
          <Sparkles size={12} /> PROTOCOLOS FINANCIEROS CIFRADOS
        </div>
        <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          MODALIDADES DE PAGO BOLIVIA
        </h3>
        <p className="text-xs sm:text-sm text-[#7A7A85] mt-2">
          Paga con QR Simple interbancario o abona en cuotas contra entrega.
        </p>
      </div>

      {/* 3 Interactive Mode Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Option 1: 100% QR */}
        <div
          onClick={() => handleSelect('full')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
            selectedMode === 'full'
              ? 'bg-[#C8A961]/15 border-[#C8A961] shadow-[0_0_30px_rgba(200,169,97,0.25)] -translate-y-1'
              : 'bg-[#0f0f14] border-[#22222A] hover:border-[#35353E] opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#C8A961]/20 border border-[#C8A961]/30 flex items-center justify-center text-[#C8A961]">
              <Zap size={20} />
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#30A46C]/20 border border-[#30A46C]/40 text-[#30A46C] text-[10px] font-mono font-extrabold flex items-center gap-1 animate-pulse">
              <Gift size={11} /> SOUVENIR GRATIS
            </span>
          </div>
          <h4 className="text-base font-extrabold text-white uppercase">100% Pago QR</h4>
          <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
            Abona el monto completo por QR bancario y recibe de regalo un <strong>Souvenir Táctico Sorpresa Oficial</strong> en tu paquete.
          </p>
        </div>

        {/* Option 2: 50 / 50 */}
        <div
          onClick={() => handleSelect('split')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
            selectedMode === 'split'
              ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-[0_0_30px_rgba(59,130,246,0.25)] -translate-y-1'
              : 'bg-[#0f0f14] border-[#22222A] hover:border-[#35353E] opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
              <Lock size={20} />
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-mono font-extrabold">
              FLEXIBILIDAD
            </span>
          </div>
          <h4 className="text-base font-extrabold text-white uppercase">Pago 50 / 50</h4>
          <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
            50% de anticipo por QR Simple para preparar el despacho y el 50% restante lo abonas al recibir tu paquete.
          </p>
        </div>

        {/* Option 3: Contraentrega */}
        <div
          onClick={() => handleSelect('delivery')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
            selectedMode === 'delivery'
              ? 'bg-[#F5A623]/15 border-[#F5A623] shadow-[0_0_30px_rgba(245,166,35,0.25)] -translate-y-1'
              : 'bg-[#0f0f14] border-[#22222A] hover:border-[#35353E] opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
              <Shield size={20} />
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-[10px] font-mono font-extrabold">
              ZONAS LOCALES
            </span>
          </div>
          <h4 className="text-base font-extrabold text-white uppercase">Contra Entrega</h4>
          <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
            Paga en efectivo o QR directamente en puerta al chofer motorizado en Cercado y recojo en almacén.
          </p>
        </div>
      </div>

      {/* Interactive Unboxing Visualizer when 100% QR is chosen */}
      {selectedMode === 'full' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#C8A961]/10 via-[#111116] to-[#C8A961]/10 border border-[#C8A961]/35 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-[#C8A961]/20 border border-[#C8A961]/40 flex items-center justify-center text-[#C8A961] flex-shrink-0 animate-bounce">
            <Gift size={40} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-[#30A46C] uppercase mb-1">
              <CheckCircle2 size={14} /> ¡STICKERS TÁCTICOS INCLUIDOS EN TU CAJA!
            </div>
            <h5 className="text-base font-extrabold text-white">
               Pack de Stickers Tácticos Exclusivos
            </h5>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Al pagar el 100% de tu orden por QR Simple, nuestro almacén añade automáticamente un artículo táctico coleccionable sin costo adicional.
            </p>
          </div>
          <div className="text-center sm:text-right flex-shrink-0 font-mono">
            <span className="text-[10px] text-[#5E5E68] block">VALOR REGALO</span>
            <span className="text-xl font-extrabold text-[#DEC07A]">Bs. 35.00</span>
            <span className="text-[10px] text-[#30A46C] block font-bold">100% GRATIS</span>
          </div>
        </div>
      )}

      {selectedMode === 'split' && (
        <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#3b82f6]/30 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6] flex-shrink-0">
            <Lock size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h5 className="text-base font-extrabold text-white">
              Esquema de Anticipo y Saldo
            </h5>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Pagas 50% para que el armero empaque tu producto con precinto de seguridad. Al recibir tu paquete en mano o en terminal de buses, abonas el 50% restante.
            </p>
          </div>
        </div>
      )}

      {selectedMode === 'delivery' && (
        <div className="p-6 rounded-2xl bg-[#1f160a] border border-[#F5A623]/30 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#F5A623] flex-shrink-0">
            <Shield size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h5 className="text-base font-extrabold text-white">
              Cobro en Puerta o Almacén Central
            </h5>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Disponible para entregas en Cercado (Cochabamba) o recojo personal en nuestro almacén central de Av. Heroínas #560.
            </p>
          </div>
        </div>
      )}

      {/* Supported Banks in Bolivia */}
      <div className="mt-8 pt-6 border-t border-[#22222A] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#5E5E68]">
        <span>COMPATIBLE CON TODOS LOS BANCOS DE BOLIVIA (SIMPLE QR):</span>
        <div className="flex flex-wrap items-center gap-3 text-white/70">
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">BNB</span>
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">BCP</span>
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">BANCO UNIÓN</span>
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">BMSC</span>
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">BANCO SOL</span>
          <span className="px-2 py-1 rounded bg-[#14141a] border border-[#22222A]">FIE</span>
        </div>
      </div>
    </div>
  );
}
