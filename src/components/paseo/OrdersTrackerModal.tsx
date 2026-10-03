'use client';

import React, { useState } from 'react';
import { 
  X, CheckCircle, Clock, MapPin, QrCode, Store, 
  ChevronRight, RefreshCw, Sparkles, ChefHat, PackageCheck, AlertCircle 
} from 'lucide-react';
import { usePaseoToast } from './PaseoToast';

interface OrdersTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrdersTrackerModal({ isOpen, onClose }: OrdersTrackerModalProps) {
  const { showToast } = usePaseoToast();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(2); // Preparando por defecto

  const steps = [
    { key: 'recibido', label: 'Recibido', desc: 'Orden enviada al local' },
    { key: 'confirmado', label: 'Confirmado', desc: 'Cocina aceptó el pedido' },
    { key: 'preparando', label: 'Preparando', desc: 'En elaboración' },
    { key: 'listo', label: 'Listo para Retiro', desc: 'Acércate al mostrador' },
    { key: 'entregado', label: 'Entregado', desc: '¡Buen provecho!' },
  ];

  // Cálculo del porcentaje de progreso según Regla 16
  const progressPercent = Math.round(((currentStepIndex) / (steps.length - 1)) * 100);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      showToast(
        `Estado actualizado: ${steps[next].label}`,
        next === steps.length - 1 ? 'success' : 'info',
        steps[next].desc
      );
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    showToast('Simulador reiniciado', 'info', 'Orden en estado Recibido.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#030B1A]/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Contenido Modal (Regla 15: scale 0.95 -> 1, 300ms expo-out) */}
      <div
        className="relative w-full max-w-xl rounded-3xl bg-[#061734] border border-[#FF6B1A]/30 p-6 sm:p-7 text-white shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        style={{
          animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Línea LED Superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[#FF6B1A]/15 border border-[#FF6B1A]/40 text-[#FF6B1A]">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black font-display tracking-tight text-white">
                Seguimiento de Pedido
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/30">
                #PA-8492
              </span>
            </div>
            <p className="text-xs text-white/60">
              Terraza Grill & Beer · Local 302 (Terraza Gastronómica, Piso 3)
            </p>
          </div>
        </div>

        {/* Barra de Progreso Animada (Regla 16: 0 -> 100% en 1000ms cubic-bezier(0.16, 1, 0.3, 1)) */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-semibold text-white/70">Progreso de la Orden</span>
            <span className="font-mono font-bold text-[#FF8F4D] tabular-nums">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
            <div
              style={{
                width: `${progressPercent}%`,
                transition: 'width 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`h-full rounded-full bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C] ${
                progressPercent === 100 ? 'pulse-number-done' : ''
              }`}
            />
          </div>
        </div>

        {/* Línea de Tiempo de Estados */}
        <div className="space-y-3 mb-6">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-[#FF6B1A]/15 border-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/15'
                    : isCompleted
                    ? 'bg-white/5 border-emerald-500/30 text-white/80'
                    : 'bg-black/20 border-white/5 text-white/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-black'
                        : isCurrent
                        ? 'bg-[#FF6B1A] text-white animate-pulse'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">{step.label}</h4>
                    <p className="text-[11px] text-white/50">{step.desc}</p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#FF6B1A]/20 text-[#FF8F4D]">
                    En curso
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumen de Productos y Código de Retiro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="font-bold text-white/50 uppercase tracking-wider block mb-2 text-[10px]">
              Artículos en preparación
            </span>
            <ul className="space-y-1 text-white/90">
              <li className="flex justify-between">
                <span>1x Bife de Chorizo a la Leña</span>
                <span className="font-mono text-[#D4A24C]">Bs 85</span>
              </li>
              <li className="flex justify-between">
                <span>1x Cerveza Artesanal Taquiña</span>
                <span className="font-mono text-[#D4A24C]">Bs 25</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-bold text-white/50 uppercase tracking-wider block text-[10px]">
                Código de Retiro
              </span>
              <span className="text-xl font-mono font-black text-[#FF6B1A]">
                PA-8492
              </span>
              <p className="text-[10px] text-white/60">Presenta en caja o mostrador</p>
            </div>
            <div className="p-2 rounded-xl bg-white text-black">
              <QrCode className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Controles del Simulador para Demostración en Vivo */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white text-xs font-bold btn-primary-andino flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Avanzar Estado</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
              title="Reiniciar simulador"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
