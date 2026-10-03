'use client';

import React, { useState } from 'react';
import { Sparkles, Mic, Brain, Volume2 } from 'lucide-react';

export type JarvisOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface JarvisOrbProps {
  initialState?: JarvisOrbState;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  onStateChange?: (state: JarvisOrbState) => void;
}

export function JarvisOrb({
  initialState = 'idle',
  size = 'md',
  showControls = true,
  onStateChange,
}: JarvisOrbProps) {
  const [orbState, setOrbState] = useState<JarvisOrbState>(initialState);

  const handleSetState = (newState: JarvisOrbState) => {
    setOrbState(newState);
    if (onStateChange) onStateChange(newState);
  };

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Contenedor Exterior del Orbe */}
      <div className="relative flex items-center justify-center p-8 select-none">
        {/* Ondas concéntricas expandiéndose (Regla 6) */}
        {/* Escuchando: ondas cada 1.5s */}
        {orbState === 'listening' && (
          <>
            <div 
              className="absolute inset-0 rounded-full border-2 border-[#FF6B1A]/60 pointer-events-none animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
            <div 
              className="absolute inset-0 rounded-full border border-[#D4A24C]/40 pointer-events-none animate-ping"
              style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}
            />
          </>
        )}

        {/* Hablando: ondas suaves y sincronizadas */}
        {orbState === 'speaking' && (
          <>
            <div 
              className="absolute inset-0 rounded-full border border-white/40 pointer-events-none animate-ping"
              style={{ animationDuration: '2.0s' }}
            />
            <div 
              className="absolute inset-0 rounded-full border border-[#FF8F4D]/30 pointer-events-none animate-ping"
              style={{ animationDuration: '2.0s', animationDelay: '0.7s' }}
            />
          </>
        )}

        {/* Resplandor ambiental de fondo (Transición 400ms Regla 6) */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl opacity-50 transition-all duration-400"
          style={{
            background: orbState === 'thinking' 
              ? 'radial-gradient(circle, #D4A24C 0%, #B84D0B 70%, transparent 100%)' 
              : orbState === 'listening'
              ? 'radial-gradient(circle, #FF6B1A 0%, #B84D0B 60%, transparent 100%)'
              : 'radial-gradient(circle, #FF8F4D 0%, #B84D0B 60%, transparent 100%)'
          }}
        />

        {/* Orbe Central con Transición de 400ms (Regla 6) */}
        <div
          onClick={() => {
            const nextStates: Record<JarvisOrbState, JarvisOrbState> = {
              idle: 'listening',
              listening: 'thinking',
              thinking: 'speaking',
              speaking: 'idle',
            };
            handleSetState(nextStates[orbState]);
          }}
          className={`relative ${sizeClasses} rounded-full cursor-pointer shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-400 ${
            orbState === 'idle'
              ? 'animate-pulse'
              : orbState === 'listening'
              ? 'animate-bounce'
              : ''
          }`}
          style={{
            background: orbState === 'thinking'
              ? 'linear-gradient(135deg, #D4A24C 0%, #B84D0B 50%, #061734 100%)'
              : 'linear-gradient(135deg, #FF6B1A 0%, #B84D0B 45%, #061734 100%)',
            boxShadow: orbState === 'thinking'
              ? '0 0 50px rgba(212, 162, 76, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.4)'
              : '0 0 50px rgba(255, 107, 26, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.4)',
            animationDuration: orbState === 'idle' ? '3s' : '1s',
          }}
        >
          {/* Anillo concéntrico 1 (exterior) - Rotación lenta de 20s en Idle (Regla 6) */}
          <div 
            className="absolute inset-2 rounded-full border border-white/20 border-dashed animate-spin"
            style={{ animationDuration: orbState === 'thinking' ? '3s' : '20s' }}
          />

          {/* Anillo concéntrico 2 (medio) */}
          <div 
            className="absolute inset-5 rounded-full border border-[#D4A24C]/40 border-dotted animate-spin"
            style={{ 
              animationDuration: orbState === 'thinking' ? '2s' : '8s', 
              animationDirection: 'reverse' 
            }}
          />

          {/* Anillo concéntrico 3 (núcleo interno con brillo pulsante) */}
          <div 
            className="absolute inset-9 rounded-full border border-white/30 animate-pulse"
            style={{ animationDuration: '2s' }}
          />

          {/* Núcleo Interior de Energía con Ícono y Estado */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white text-center">
            {orbState === 'idle' && <Sparkles className="w-8 h-8 text-amber-200 animate-pulse" />}
            {orbState === 'listening' && <Mic className="w-8 h-8 text-white animate-bounce" />}
            {orbState === 'thinking' && <Brain className="w-8 h-8 text-amber-300 animate-spin" />}
            {orbState === 'speaking' && <Volume2 className="w-8 h-8 text-white animate-pulse" />}
            
            <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-white/90">
              {orbState === 'idle' && 'Jarvis'}
              {orbState === 'listening' && 'Oyendo...'}
              {orbState === 'thinking' && 'Pensando'}
              {orbState === 'speaking' && 'Hablando'}
            </span>
          </div>
        </div>
      </div>

      {/* Controles interactivos para demo en vivo */}
      {showControls && (
        <div className="flex items-center gap-1.5 p-1.5 bg-[#061734]/90 backdrop-blur-md rounded-full border border-white/10 text-xs shadow-lg">
          <button
            onClick={() => handleSetState('idle')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              orbState === 'idle' ? 'bg-[#B84D0B] text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Espera
          </button>
          <button
            onClick={() => handleSetState('listening')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              orbState === 'listening' ? 'bg-[#FF6B1A] text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Escuchar
          </button>
          <button
            onClick={() => handleSetState('thinking')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              orbState === 'thinking' ? 'bg-[#D4A24C] text-black shadow-md font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Pensar
          </button>
          <button
            onClick={() => handleSetState('speaking')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              orbState === 'speaking' ? 'bg-[#FF8F4D] text-black shadow-md font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Hablar
          </button>
        </div>
      )}
    </div>
  );
}
