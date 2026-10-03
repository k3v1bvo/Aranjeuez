'use client';

import React, { useState } from 'react';
import { ShoppingBag, MapPin, Plus, Check, Clock, ArrowRight, Heart } from 'lucide-react';
import { MOCK_PRODUCTS, Product } from '@/lib/mock-data';
import { ProductDetailModal } from './ProductDetailModal';
import { ScrollRevealContainer, ScrollRevealItem, ScrollReveal } from './ScrollReveal';
import { usePaseoToast } from './PaseoToast';
import { CartItem } from './CartDrawerModal';

interface PaseoYaShowcaseProps {
  onOpenQr: () => void;
  onAddToCartItem?: (item: CartItem) => void;
}

export function PaseoYaShowcase({ onOpenQr, onAddToCartItem }: PaseoYaShowcaseProps) {
  const { showToast } = usePaseoToast();
  const [selectedFloor, setSelectedFloor] = useState<string>('todos');
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const filteredProducts = selectedFloor === 'todos' 
    ? MOCK_PRODUCTS 
    : MOCK_PRODUCTS.filter(p => {
        if (selectedFloor === 'piso-1') return p.floorLabel.includes('Piso 1');
        if (selectedFloor === 'piso-2') return p.floorLabel.includes('Piso 2');
        if (selectedFloor === 'terraza') return p.floorLabel.includes('Terraza');
        return true;
      });

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowFavorite = !favorites[productId];
    setFavorites(prev => ({ ...prev, [productId]: isNowFavorite }));
    showToast(
      isNowFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos',
      isNowFavorite ? 'success' : 'info'
    );
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItemsCount((prev) => prev + quantity);
    setLastAdded(`${quantity}x ${product.name}`);
    
    // Si tenemos callback conectado, pasamos el item real a la canasta
    if (onAddToCartItem) {
      onAddToCartItem({
        id: product.id,
        name: product.name,
        storeName: product.storeName,
        storeLocation: product.floorLabel,
        price: product.price,
        quantity: quantity,
        imageUrl: product.image,
      });
    }

    showToast('Agregado a tu canasta PaseoYa', 'success', `${quantity}x ${product.name} listo para retiro.`);
    setTimeout(() => setLastAdded(null), 3000);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#061734]/50 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado con ScrollReveal (Regla 1) */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-3">
                <ShoppingBag className="w-4 h-4" />
                Retiro en Local · Click & Collect
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
                PASEO<span className="text-[#FF6B1A]">YA</span> MARKETPLACE
              </h2>
              <p className="text-white/60 text-base max-w-xl mt-2 font-sans">
                Compra en línea a comercios de la torre y retira de inmediato en el local físico con tu código QR y PIN de retiro.
              </p>
            </div>

            {/* Filtros por Piso (Regla 3 & 13) */}
            <div className="flex flex-wrap items-center gap-2 bg-[#030B1A]/80 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setSelectedFloor('todos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFloor === 'todos'
                    ? 'bg-[#FF6B1A] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Todos los Niveles
              </button>
              <button
                onClick={() => setSelectedFloor('piso-1')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFloor === 'piso-1'
                    ? 'bg-[#FF6B1A] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Piso 1
              </button>
              <button
                onClick={() => setSelectedFloor('piso-2')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFloor === 'piso-2'
                    ? 'bg-[#FF6B1A] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Piso 2
              </button>
              <button
                onClick={() => setSelectedFloor('terraza')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFloor === 'terraza'
                    ? 'bg-[#FF6B1A] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Terraza Gastronómica
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Grid de Productos con ScrollRevealContainer (Regla 1: stagger 60ms) y Card Hover (Regla 2) */}
        <ScrollRevealContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ScrollRevealItem key={product.id}>
              <div
                onClick={() => setSelectedProduct(product)}
                className="group rounded-3xl glass-andino card-hover-product border border-white/10 overflow-hidden flex flex-col justify-between cursor-pointer h-full"
              >
                <div>
                  <div className="relative h-56 w-full overflow-hidden bg-black/40">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                      {product.category}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <div className="px-2.5 py-1 rounded-full bg-[#D4A24C] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                        +{product.pointsReward} pts
                      </div>
                      {/* Corazón de Favoritos con Micro-interacción (Regla 18) */}
                      <button
                        onClick={(e) => toggleFavorite(product.id, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md bg-black/50 text-white transition-all ${
                          favorites[product.id] ? 'heart-active' : 'hover:scale-110'
                        }`}
                        aria-label="Marcar como favorito"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-1.5 text-xs text-[#D4A24C] font-semibold mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{product.storeName}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/70">{product.floorLabel}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B1A] transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-semibold">Precio Retiro</span>
                    <span className="text-2xl font-black text-white font-mono tabular-nums">
                      Bs. {product.price}
                    </span>
                  </div>

                  {/* Botón con micro-interacción Regla 3 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product, 1);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Retirar</span>
                  </button>
                </div>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealContainer>

        {/* Modal de Detalle de Producto Expandido */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />

        {/* Banner Explicativo de Click & Collect */}
        <ScrollReveal delay={0.2}>
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#061734] to-[#030B1A] border border-[#FF6B1A]/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 flex items-center justify-center text-[#FF6B1A]">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-display">
                  Retiro In Situ en Paseo Aranjuez
                </h4>
                <p className="text-sm text-white/60 mt-1 max-w-xl">
                  Realiza tu pedido desde la app, la tienda lo empaqueta y, al presentarte en el local físico, escanean tu código QR de retiro en segundos. Retiro presencial obligatorio en Paseo Aranjuez.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenQr}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 whitespace-nowrap border border-white/10 btn-arrow-hover"
            >
              <span>Ver mi credencial</span>
              <ArrowRight className="w-4 h-4 text-[#FF6B1A] arrow-icon" />
            </button>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
