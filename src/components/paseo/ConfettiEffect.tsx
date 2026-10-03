'use client';

import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface ConfettiEffectProps {
  active: boolean;
  onComplete?: () => void;
  title?: string;
  message?: string;
}

export function ConfettiEffect({
  active,
  onComplete,
  title = '¡Canje Exitoso!',
  message = 'Tu cupón ha sido acreditado en tu credencial QR',
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 100 partículas con colores oficiales
    const colors = ['#B84D0B', '#FF6B1A', '#D4A24C', '#FFFFFF', '#FF8F4D'];
    const particleCount = 100;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      shape: 'rect' | 'circle' | 'stepped';
      opacity: number;
    }> = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.6 ? 'circle' : Math.random() > 0.3 ? 'rect' : 'stepped',
        opacity: 1,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 2500;

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fadeOutProgress = elapsed > 2000 ? (elapsed - 2000) / 500 : 0;
      const globalOpacity = Math.max(0, 1 - fadeOutProgress);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravedad
        p.vx *= 0.98; // Resistencia del aire
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * globalOpacity;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
        } else {
          // Forma escalonada
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size / 2, p.size / 2);
          ctx.fillRect(0, 0, p.size / 2, p.size / 2);
        }

        ctx.restore();
      }

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Canvas para la lluvia de partículas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Check central animado: scale(0) -> scale(1.2) -> scale(1) */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-[#061734]/95 border-2 border-[#D4A24C] shadow-2xl backdrop-blur-xl animate-in zoom-in-50 duration-500 pointer-events-auto">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#22C55E] to-[#D4A24C] flex items-center justify-center shadow-lg shadow-[#22C55E]/40 mb-4 animate-in zoom-in-75 duration-700">
          <Check className="w-10 h-10 text-black stroke-[3]" />
        </div>
        <h3 className="text-2xl font-black text-white font-display text-center mb-1">
          {title}
        </h3>
        <p className="text-sm text-white/70 text-center max-w-xs font-sans">
          {message}
        </p>
      </div>
    </div>
  );
}
