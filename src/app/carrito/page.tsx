'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-tactical-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-28 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={36} className="text-tactical-500" />
          </div>
          <h1 className="text-2xl font-bold text-tactical-200 mb-2">Tu carrito está vacío</h1>
          <p className="text-tactical-500 mb-6">Explora nuestro catálogo y agrega productos tácticos.</p>
          <Link href="/" className="btn-tactical inline-flex items-center gap-2">
            Explorar catálogo <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-36 sm:pb-24">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Carrito de Compras</h1>
            <span className="text-xs text-tactical-400 font-mono">{totalItems} productos en el arsenal</span>
          </div>
          <button onClick={() => { clearCart(); toast.info('Carrito vaciado'); }} className="btn-ghost text-xs py-2 px-3">
            <Trash2 size={14} className="mr-1" /> Vaciar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="glass-card-static p-3 sm:p-4 flex gap-3 sm:gap-4 animate-fade-in">
                {/* Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-tactical-800 border border-white/[0.06]">
                  <Image
                    src={product.images[0] || '/placeholder-tactical.svg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/producto/${product.id}`} className="text-sm font-semibold text-tactical-100 hover:text-amber-accent transition-colors line-clamp-1">
                      {product.name}
                    </Link>
                    {product.category && (
                      <span className="text-[10px] text-tactical-500 font-mono block mt-0.5">{product.category.name}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-white/[0.04]">
                    {/* Quantity Stepper (Mobile Touch Optimized) */}
                    <div className="flex items-center border border-white/[0.12] bg-[#0c0c10] rounded-xl overflow-hidden shadow-inner">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-white/[0.08] active:bg-[#C8A961]/20 transition-colors touch-manipulation"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={14} className="text-tactical-300" />
                      </button>
                      <span className="px-2.5 sm:px-3 text-xs sm:text-sm font-mono font-bold text-white min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-white/[0.08] active:bg-[#C8A961]/20 transition-colors touch-manipulation"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={14} className="text-tactical-300" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <span className="text-sm sm:text-base font-bold text-[#C8A961] font-mono">
                        Bs. {(product.price * quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => { removeItem(product.id); toast.info(`${product.name} eliminado`); }}
                        className="p-2 rounded-lg hover:bg-red-alert/15 text-tactical-500 hover:text-red-alert transition-colors touch-manipulation"
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary (Desktop Sidebar) */}
          <div className="lg:col-span-1">
            <div className="glass-card-static p-5 sticky top-24">
              <h3 className="text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-4 font-mono">
                Resumen del pedido
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-tactical-400">
                  <span>Productos ({totalItems})</span>
                  <span className="font-mono text-white">Bs. {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-tactical-400">
                  <span>Envío</span>
                  <span className="text-[#C8A961] text-xs font-medium">Recojo gratis / Delivery</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between items-baseline">
                  <span className="text-base font-semibold text-white">Subtotal</span>
                  <span className="text-2xl font-bold text-[#C8A961] font-mono">Bs. {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-tactical w-full flex items-center justify-center gap-2 mt-5 py-3.5 text-sm font-bold shadow-lg shadow-[#C8A961]/15">
                Proceder al Checkout <ArrowRight size={16} />
              </Link>

              <div className="flex items-center gap-2 mt-4 text-[11px] text-tactical-500 justify-center font-mono">
                <ShieldCheck size={14} className="text-green-tactical" />
                Pago seguro QR · Banco Unión / Yape
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Checkout Bar (Visible only on mobile screens) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-[#070709]/95 backdrop-blur-2xl border-t border-[#C8A961]/25 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] text-tactical-400 font-mono uppercase block">Total ({totalItems} ítems)</span>
            <span className="text-lg font-black font-mono text-[#C8A961]">Bs. {totalPrice.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-tactical py-3 px-6 text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#C8A961]/25 active:scale-95 touch-manipulation"
          >
            <span>Ir al Checkout</span> <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
