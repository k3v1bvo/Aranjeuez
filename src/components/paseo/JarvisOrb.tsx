'use client';
import { Sparkles, Mic, Brain, Volume2 } from 'lucide-react';

export type JarvisOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface JarvisOrbProps {
  onClick?: () => void;
  state?: JarvisOrbState;
  size?: 'sm' | 'md' | 'lg';
}

export function JarvisOrb({ onClick, state = 'idle', size = 'md' }: JarvisOrbProps) {
  const sizePx = { sm: 112, md: 192, lg: 288 }[size];
  const iconSize = { sm: 24, md: 32, lg: 48 }[size];

  const gradients: Record<JarvisOrbState, string> = {
    idle: 'linear-gradient(135deg, #FF6B1A 0%, #B84D0B 45%, #061734 100%)',
    listening: 'linear-gradient(135deg, #FF6B1A 0%, #FF8F4D 40%, #B84D0B 100%)',
    thinking: 'linear-gradient(135deg, #D4A24C 0%, #B84D0B 50%, #061734 100%)',
    speaking: 'linear-gradient(135deg, #FF8F4D 0%, #D4A24C 45%, #061734 100%)',
  };

  const glows: Record<JarvisOrbState, string> = {
    idle: '0 0 40px rgba(255,107,26,0.4), inset 0 0 25px rgba(255,255,255,0.3)',
    listening: '0 0 60px rgba(255,107,26,0.65), 0 0 120px rgba(255,107,26,0.25), inset 0 0 30px rgba(255,255,255,0.35)',
    thinking: '0 0 50px rgba(212,162,76,0.6), 0 0 100px rgba(212,162,76,0.2), inset 0 0 30px rgba(255,255,255,0.4)',
    speaking: '0 0 55px rgba(255,143,77,0.55), 0 0 110px rgba(255,107,26,0.2), inset 0 0 30px rgba(255,255,255,0.35)',
  };

  const labels: Record<JarvisOrbState, string> = {
    idle: 'JARVIS',
    listening: 'OYENDO…',
    thinking: 'PENSANDO',
    speaking: 'HABLANDO',
  };

  const ariaLabels: Record<JarvisOrbState, string> = {
    idle: 'Activar micrófono de Jarvis',
    listening: 'Enviar lo que dije',
    thinking: 'Procesando consulta',
    speaking: 'Silenciar a Jarvis',
  };

  const ringSpeed = state === 'thinking' ? '3s' : '20s';
  const innerRingSpeed = state === 'thinking' ? '2s' : '8s';

  return (
    <div className="jarvis-orb-wrapper">
      <div className="jarvis-orb-container" style={{ width: sizePx + 64, height: sizePx + 64 }}>
        {/* Ripple waves for listening */}
        {state === 'listening' && (
          <>
            <div className="jarvis-ripple jarvis-ripple-1" />
            <div className="jarvis-ripple jarvis-ripple-2" />
          </>
        )}

        {/* Ripple waves for speaking */}
        {state === 'speaking' && (
          <>
            <div className="jarvis-ripple jarvis-ripple-speak-1" />
            <div className="jarvis-ripple jarvis-ripple-speak-2" />
          </>
        )}

        {/* Ambient glow */}
        <div
          className="jarvis-ambient-glow"
          style={{
            background:
              state === 'thinking'
                ? 'radial-gradient(circle, #D4A24C 0%, #B84D0B 70%, transparent 100%)'
                : state === 'listening'
                  ? 'radial-gradient(circle, #FF6B1A 0%, #B84D0B 60%, transparent 100%)'
                  : 'radial-gradient(circle, #FF8F4D 0%, #B84D0B 60%, transparent 100%)',
          }}
        />

        {/* Main orb */}
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabels[state]}
          className={`jarvis-orb jarvis-orb-${state}`}
          style={{
            width: sizePx,
            height: sizePx,
            background: gradients[state],
            boxShadow: glows[state],
          }}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.();
            }
          }}
        >
          {/* Concentric rings */}
          <div
            className="jarvis-ring jarvis-ring-outer"
            style={{ animationDuration: ringSpeed }}
          />
          <div
            className="jarvis-ring jarvis-ring-middle"
            style={{ animationDuration: innerRingSpeed, animationDirection: 'reverse' }}
          />
          <div className="jarvis-ring jarvis-ring-inner" />

          {/* Center icon + label */}
          <div className="jarvis-orb-core">
            {state === 'idle' && <Sparkles size={iconSize} className="jarvis-icon-pulse" />}
            {state === 'listening' && <Mic size={iconSize} className="jarvis-icon-bounce" />}
            {state === 'thinking' && <Brain size={iconSize} className="jarvis-icon-spin" />}
            {state === 'speaking' && <Volume2 size={iconSize} className="jarvis-icon-pulse" />}
            <span className="jarvis-orb-label">{labels[state]}</span>
          </div>
        </div>
      </div>

      {/* Status indicator bar */}
      <div className="jarvis-status-bar">
        {(['idle', 'listening', 'thinking', 'speaking'] as JarvisOrbState[]).map((s) => (
          <span
            key={s}
            className={`jarvis-status-dot ${state === s ? 'jarvis-status-active' : ''}`}
            style={{
              background: state === s
                ? s === 'idle' ? '#FF6B1A'
                  : s === 'listening' ? '#FF8F4D'
                    : s === 'thinking' ? '#D4A24C'
                      : '#FF8F4D'
                : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
