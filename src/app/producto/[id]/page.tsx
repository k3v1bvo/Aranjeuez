'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { ShoppingCart, Minus, Plus, ArrowLeft, Shield, Package, AlertTriangle, Check, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { products } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const product = products.find(p => p.id === params.id);

  if (!product) {
    return (
      <div className="min-h-screen bg-tactical-900">
        <Navbar />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-bold text-tactical-300">Producto no encontrado</h1>
          <button onClick={() => router.push('/')} className="btn-tactical mt-4">Volver al catálogo</button>
        </div>
      </div>
    );
  }

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80'];
  const currentImage = allImages[selectedImageIndex] || allImages[0];

  const isLowStock = product.stock <= product.low_stock_threshold;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    toast.success(`${product.name} agregado al carrito`, {
      description: `Bs. ${product.price.toFixed(2)} × ${quantity} = Bs. ${(product.price * quantity).toFixed(2)}`,
    });
  };

  const features = [
    { icon: Shield, text: 'Calidad militar certificada' },
    { icon: Truck, text: 'Envío seguro y discreto' },
    { icon: Package, text: 'Garantía de satisfacción' },
  ];

  return (
    <div className="min-h-screen bg-tactical-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Breadcrumb */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-tactical-400 hover:text-tactical-200 transition-colors mb-6 text-sm">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Multi-Photo Gallery Stage */}
          <div className="space-y-3">
            <div className="glass-card-static overflow-hidden relative rounded-2xl border border-[#22222A] bg-[#0c0c10]">
              <div className="relative aspect-square">
                <Image
                  src={currentImage}
                  alt={`${product.name} - Vista ${selectedImageIndex + 1}`}
                  fill
                  className="object-cover transition-all duration-300"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <span className="badge badge-cancelled text-base px-4 py-2"><Package size={16} /> Agotado</span>
                  </div>
                )}

                {/* Photo counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-[#C8A961] text-[10px] font-mono px-2.5 py-1 rounded-md border border-[#C8A961]/30">
                    Foto {selectedImageIndex + 1} de {allImages.length}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails row */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-[#C8A961] ring-2 ring-[#C8A961]/40 shadow-lg scale-105'
                        : 'border-[#22222A] opacity-60 hover:opacity-100 hover:border-neutral-500'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="animate-fade-in-up">
            {product.category && (
              <span className="text-xs font-semibold text-amber-accent tracking-wider uppercase">{product.category.name}</span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-4">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-white">Bs. {product.price.toFixed(2)}</span>
              {/* Stock indicator */}
              <span className={`badge ${isOutOfStock ? 'badge-cancelled' : isLowStock ? 'badge-warning' : 'badge-delivered'}`}>
                {isOutOfStock ? 'Sin stock' : isLowStock ? `Últimas ${product.stock} unidades` : `${product.stock} en stock`}
              </span>
            </div>

            {/* Description */}
            <p className="text-tactical-300 text-sm leading-relaxed mb-8">{product.description}</p>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border border-white/[0.12] bg-[#0c0c10] rounded-xl overflow-hidden self-start sm:self-auto shadow-inner">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-white/[0.08] active:bg-[#C8A961]/20 transition-colors touch-manipulation"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={16} className="text-tactical-300" />
                  </button>
                  <span className="px-4 text-white font-mono font-bold min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-white/[0.08] active:bg-[#C8A961]/20 transition-colors touch-manipulation"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={16} className="text-tactical-300" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-tactical flex items-center justify-center gap-2 flex-1 py-3.5 px-6 text-sm sm:text-base font-bold shadow-lg shadow-[#C8A961]/20 active:scale-95 touch-manipulation"
                >
                  <ShoppingCart size={18} />
                  <span>Agregar al arsenal — Bs. {(product.price * quantity).toFixed(2)}</span>
                </button>
              </div>
            )}

            {/* Features */}
            <div className="space-y-3 pt-6 border-t border-white/[0.06]">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-tactical-300">
                  <div className="w-8 h-8 rounded-lg bg-green-tactical/10 flex items-center justify-center">
                    <f.icon size={16} className="text-green-tactical" />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Purchase Bar (Mobile only) */}
      {!isOutOfStock && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-40 bg-[#070709]/95 backdrop-blur-2xl border-t border-[#C8A961]/25 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <span className="text-[10px] text-tactical-400 font-mono uppercase block">Total Arsenal</span>
              <span className="text-base font-black font-mono text-[#C8A961]">
                Bs. {(product.price * quantity).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              className="btn-tactical py-3 px-5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#C8A961]/25 active:scale-95 touch-manipulation"
            >
              <ShoppingCart size={16} />
              <span>Añadir ({quantity})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
