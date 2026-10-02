'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { tacticalAudio } from '@/lib/tactical-audio';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface TiltProductCardProps {
  product: Product;
}

export function TiltProductCard({ product }: TiltProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const cardRef = useRef<HTMLDivElement>(null);

  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const isLow = product.stock <= product.low_stock_threshold && product.stock > 0;
  const isOut = product.stock === 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
    const rotateY = ((x - centerX) / centerX) * 9;

    setTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOut) {
      toast.error('Producto agotado');
      return;
    }
    tacticalAudio.playAddCart();
    addItem(product, 1);
    toast.success(`"${product.name}" añadido al arsenal`, {
      description: `Bs. ${product.price.toFixed(2)} · Listo para checkout`,
    });
  };

  const imgUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80';
  const hoverImgUrl = (product.images && product.images.length > 1) ? product.images[1] : null;
  const photoCount = product.images ? product.images.length : 1;

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full h-full"
    >
      <div
        ref={cardRef}
        onClick={() => router.push(`/producto/${product.id}`)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setIsHovered(true);
          tacticalAudio.playBlip();
        }}
        onMouseLeave={handleMouseLeave}
        className="group relative h-full flex flex-col justify-between rounded-2xl border border-[#22222A] bg-[#0c0c10]/90 backdrop-blur-xl p-4 cursor-pointer overflow-hidden transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(0px)`,
          transformStyle: 'preserve-3d',
          boxShadow: isHovered
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(200, 169, 97, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          borderColor: isHovered ? 'rgba(200, 169, 97, 0.35)' : 'rgba(34, 34, 42, 1)',
        }}
      >
        {/* Moving Specular Glare Sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.3 : 0,
            background: `radial-gradient(circle 280px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.25), transparent 70%)`,
          }}
        />

        {/* Product Image Stage */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#14141a] mb-3">
          <Image
            src={isHovered && hoverImgUrl ? hoverImgUrl : imgUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-108 transition-all duration-500 brightness-90 group-hover:brightness-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10]/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

          {/* Multi-photo badge */}
          {photoCount > 1 && (
            <div
              className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none"
              style={{ transform: 'translateZ(20px)' }}
            >
              <span className="bg-black/85 text-[#C8A961] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#C8A961]/35 backdrop-blur-md shadow flex items-center gap-1">
                <Sparkles size={10} /> +{photoCount} fotos
              </span>
            </div>
          )}

          {/* Badges Floating in 3D */}
          <div
            className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20"
            style={{ transform: 'translateZ(20px)' }}
          >
            {isOut ? (
              <span className="bg-[#E5484D] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow">
                AGOTADO
              </span>
            ) : isLow ? (
              <span className="bg-[#F5A623] text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow">
                ÚLTIMAS {product.stock} UDS
              </span>
            ) : (
              <span className="bg-[#0c0c10]/90 text-[#C8A961] border border-[#C8A961]/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md shadow">
                MIL-SPEC
              </span>
            )}
          </div>

          <div
            className="absolute top-2.5 right-2.5 z-20"
            style={{ transform: 'translateZ(20px)' }}
          >
            <span className="bg-[#0c0c10]/90 text-[#7A7A85] text-[9px] font-mono px-2 py-0.5 rounded border border-white/5 backdrop-blur-md">
              {product.category?.name || 'Táctico'}
            </span>
          </div>

          {/* Hover View overlay button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
            <span className="bg-[#0c0c10]/95 text-[#C8A961] text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-[#C8A961]/40 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
              <Eye size={12} /> VER DETALLES
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#5E5E68] mb-1">
              REF-{product.id.slice(-6).toUpperCase()}
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#C8A961] transition-colors duration-200 line-clamp-1 mb-1">
              {product.name}
            </h4>
            <p className="text-xs text-[#7A7A85] line-clamp-2 leading-relaxed mb-3">
              {product.description || 'Equipamiento táctico de grado militar de alta durabilidad.'}
            </p>
          </div>

          {/* Bottom Bar: Price & Quick Add */}
          <div className="pt-3 border-t border-[#22222A] flex items-center justify-between">
            <div>
              <span className="text-[9px] text-[#5E5E68] font-mono uppercase block">PRECIO OFICIAL</span>
              <span className="text-base font-extrabold text-white font-mono">
                Bs. {product.price.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={isOut}
              className={`p-2.5 sm:p-2.5 min-h-[42px] min-w-[42px] rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md touch-manipulation ${
                isOut
                  ? 'bg-[#1c1c22] text-[#5E5E68] cursor-not-allowed'
                  : 'bg-[#C8A961] text-black hover:bg-[#DEC07A] active:scale-95 shadow-[0_4px_12px_rgba(200,169,97,0.3)] hover:shadow-[0_6px_20px_rgba(200,169,97,0.45)]'
              }`}
              title="Añadir al arsenal"
              aria-label="Añadir al arsenal"
            >
              <ShoppingCart size={17} />
              <span className="text-[11px] font-mono font-bold sm:hidden">AGREGAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
