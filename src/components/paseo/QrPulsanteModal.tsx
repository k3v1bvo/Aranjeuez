'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Sun, Copy, Check, Sparkles, Award } from 'lucide-react';
import { MOCK_USER } from '@/lib/mock-data';

interface QrPulsanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  points?: number;
  level?: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  qrToken?: string;
  pinCode?: string;
}

export function QrPulsanteModal({
  isOpen,
  onClose,
  userName = MOCK_USER.name,
  points = MOCK_USER.points,
  level = MOCK_USER.level,
  qrToken = MOCK_USER.qrToken,
  pinCode = MOCK_USER.pinCode,
}: QrPulsanteModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isHighBrightness, setIsHighBrightness] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(qrToken, {
        width: 280,
        margin: 2,
        color: {
          dark: '#030B1A',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [isOpen, qrToken]);

  if (!isOpen) return null;

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinCode.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className={`relative w-full max-w-sm rounded-3xl p-6 overflow-hidden transition-all duration-300 ${
          isHighBrightness ? 'bg-white text-black' : 'bg-[#061734] border border-[#FF6B1A]/30 text-white'
        }`}
        style={{
          boxShadow: isHighBrightness 
            ? '0 0 100px rgba(255, 255, 255, 0.95)' 
            : '0 0 60px rgba(184, 77, 11, 0.35)'
        }}
      >
        {/* Línea LED Superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isHighBrightness ? 'bg-gray-200 text-black hover:bg-gray-300' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header del Modal */}
        <div className="text-center mt-2 mb-4">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 text-black shadow-md font-sans"
            style={{
              background: level === 'Oro' ? 'linear-gradient(135deg, #D4A24C, #FFD700)' : 'linear-gradient(135deg, #FF6B1A, #B84D0B)',
              color: level === 'Oro' ? '#000' : '#FFF'
            }}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="tabular-nums">Nivel {level} · {points.toLocaleString()} Puntos</span>
          </div>
          <h3 className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Credencial Paseo Aranjuez
          </h3>
          <p className={`text-xs ${isHighBrightness ? 'text-gray-600' : 'text-white/60'}`}>
            Muestra este código al pagar o retirar en locales
          </p>
        </div>

        {/* Contenedor del Código QR con Brillo Pulsante y 4 Esquinas de Escaneo (Regla 5) */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative p-3 rounded-2xl bg-white border-2 border-[#FF6B1A] pulse-qr">
            {/* 4 Esquinas animadas de escaneo (Regla 5: ciclo de 2000ms alternando) */}
            <div className="absolute -top-2 -left-2 w-5 h-5 border-t-3 border-l-3 border-[#FF6B1A] rounded-tl qr-scanner-corner" />
            <div className="absolute -top-2 -right-2 w-5 h-5 border-t-3 border-r-3 border-[#D4A24C] rounded-tr qr-scanner-corner" style={{ animationDelay: '500ms' }} />
            <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-3 border-l-3 border-[#D4A24C] rounded-bl qr-scanner-corner" style={{ animationDelay: '1000ms' }} />
            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-3 border-r-3 border-[#FF6B1A] rounded-br qr-scanner-corner" style={{ animationDelay: '1500ms' }} />

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Paseo Aranjuez"
                className="w-56 h-56 rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-sm">
                Generando QR...
              </div>
            )}
            
            {/* Sello central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#B84D0B] border-2 border-white flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-bold mt-3 ${isHighBrightness ? 'text-gray-700' : 'text-white/70'}`}>
            Titular: {userName}
          </span>
        </div>

        {/* Código PIN de Respaldo */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-white/10 mb-4">
          <div>
            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isHighBrightness ? 'text-gray-500' : 'text-white/50'}`}>
              PIN de Respaldo Manual
            </span>
            <span className="text-lg font-mono font-bold tracking-widest text-[#FF6B1A] tabular-nums">
              {pinCode}
            </span>
          </div>
          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsHighBrightness(!isHighBrightness)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              isHighBrightness 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            {isHighBrightness ? 'Brillo Normal' : 'Aumentar Brillo'}
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white hover:opacity-95 shadow-lg shadow-[#B84D0B]/30"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
