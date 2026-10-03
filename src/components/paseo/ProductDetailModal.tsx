'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, MapPin, ShoppingBag, Plus, Minus, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/mock-data';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#061734] border border-[#FF6B1A]/30 text-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-400"
        style={{
          boxShadow: '0 20px 60px rgba(6, 23, 52, 0.8), 0 0 40px rgba(184, 77, 11, 0.25)',
        }}
      >
        {/* Línea LED Superior */}
        <div className="w-full h-1 led-effect" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors border border-white/10"
          aria-label="Cerrar modal de producto"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Imagen expandida con transición */}
          <div className="relative h-64 md:h-full min-h-[300px] bg-black/40 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider">
              {product.category}
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-[#D4A24C] text-black text-xs font-black uppercase tracking-wider shadow-lg">
              +{product.pointsReward * quantity} Puntos Paseo
            </div>
          </div>

          {/* Información y Compra */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Ubicación del local */}
              <div className="flex items-center gap-1.5 text-xs text-[#D4A24C] font-semibold mb-2">
                <MapPin className="w-4 h-4" />
                <span>{product.storeName}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/80">{product.floorLabel}</span>
              </div>

              <h2 className="text-2xl font-black text-white font-display leading-tight mb-3">
                {product.name}
              </h2>

              <p className="text-sm text-white/70 font-sans leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Selector de Cantidad */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/10 mb-6">
                <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                  Cantidad a Retirar
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-bold font-mono tabular-nums w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Precio y Botón Agregar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-white/50 uppercase font-semibold block">Total a Retirar</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums">
                  Bs. {product.price * quantity}
                </span>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isAdded
                    ? 'bg-[#22C55E] text-black shadow-[#22C55E]/40'
                    : 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white hover:scale-102 active:scale-98 shadow-[#B84D0B]/30'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Agregado al Retiro!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al Retiro</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
