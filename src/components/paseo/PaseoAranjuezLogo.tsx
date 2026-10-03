'use client';

import React from 'react';
import Image from 'next/image';

interface PaseoAranjuezLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function PaseoAranjuezLogo({
  className = '',
  size = 'md',
  showSubtitle = true,
}: PaseoAranjuezLogoProps) {
  const config = {
    sm: { width: 90, height: 40, subText: 'text-[9px]' },
    md: { width: 120, height: 52, subText: 'text-[10px]' },
    lg: { width: 160, height: 70, subText: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* Logotipo Oficial Oficial en PNG con Transparencia */}
      <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-105">
        <Image
          src="/aranjuez-official-logo.png"
          alt="Paseo Aranjuez — Cochabamba"
          width={config.width}
          height={config.height}
          className="object-contain filter brightness-125 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_2px_20px_rgba(212,162,76,0.5)] transition-all"
          priority
        />
      </div>

      {showSubtitle && (
        <div className="hidden sm:flex flex-col border-l border-white/20 pl-2.5 py-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A24C] leading-none">
            Cochabamba
          </span>
          <span className={`text-white/60 tracking-widest uppercase mt-0.5 ${config.subText} leading-none font-sans`}>
            Bolivia
          </span>
        </div>
      )}
    </div>
  );
}
