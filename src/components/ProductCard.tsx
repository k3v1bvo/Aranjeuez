'use client';

import React from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
  const { addItem } = useCart();

  const isLowStock = product.stock <= product.low_stock_threshold;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    toast.success(`${product.name} agregado al carrito`, {
      description: `Bs. ${product.price.toFixed(2)} × 1`,
    });
  };

  return (
    <div
      className="product-card group"
      onClick={() => onView?.(product)}
    >
      {/* Image */}
      <div className="product-image">
        <Image
          src={product.images[0] || '/placeholder-tactical.svg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Stock badge */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 z-10 badge badge-cancelled">
            <Package size={12} /> Agotado
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-10 badge badge-warning">
            <AlertTriangle size={12} /> Últimas {product.stock}
          </div>
        )}

        {/* Category tag */}
        {product.category && (
          <div className="absolute bottom-3 left-3 z-10 text-[11px] font-semibold text-tactical-300 bg-tactical-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.06]">
            {product.category.name}
          </div>
        )}

        {/* Quick add button (always visible on mobile touchscreens, hover on desktop) */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="absolute bottom-3 right-3 z-10 w-11 h-11 rounded-xl bg-[#C8A961] hover:bg-[#DEC07A] text-black font-bold flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#C8A961]/30 active:scale-95 touch-manipulation"
          aria-label="Agregar al carrito"
        >
          <ShoppingCart size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-tactical-100 line-clamp-2 mb-2 group-hover:text-amber-accent transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-white">Bs. {product.price.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <div className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-alert' : isLowStock ? 'bg-amber-accent' : 'bg-green-tactical'}`} />
            <span className="text-tactical-400">
              {isOutOfStock ? 'Sin stock' : `${product.stock} disp.`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
