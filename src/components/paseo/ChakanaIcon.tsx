'use client';

import React from 'react';

interface ChakanaIconProps {
  className?: string;
  size?: number;
  rotateOnHover?: boolean;
}

export function ChakanaIcon({
  className = 'text-[#FF6B1A]',
  size = 24,
  rotateOnHover = true,
}: ChakanaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${
        rotateOnHover ? 'transition-transform duration-500 ease-out hover:rotate-90' : ''
      }`}
    >
      {/* Geometría escalonada clásica de la Chakana de 12 vértices */}
      <path
        d="M 9 2 
           L 15 2 
           L 15 6 
           L 18 6 
           L 18 9 
           L 22 9 
           L 22 15 
           L 18 15 
           L 18 18 
           L 15 18 
           L 15 22 
           L 9 22 
           L 9 18 
           L 6 18 
           L 6 15 
           L 2 15 
           L 2 9 
           L 6 9 
           L 6 6 
           L 9 6 
           Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Círculo central sagrado */}
      <circle cx="12" cy="12" r="2.5" fill="none" strokeWidth="1.5" />
    </svg>
  );
}
