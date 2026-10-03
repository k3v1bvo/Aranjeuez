'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Compass,
  Flame,
  Gift,
  Heart,
  Layers,
  MapPin,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  X,
} from 'lucide-react';
import type { Catalog as CatalogData, Product, Store } from '@/lib/paseo/model';
import { dateTime, money } from '@/lib/paseo/model';
import { useCart, useResource } from './Providers';
import { CategoryArt, Empty, ErrorState, Loading, PageTitle } from './UI';
import { toast } from 'sonner';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function Marketplace({ storeId }: { storeId?: string }) {
  const { data, error, loading, reload } = useResource<CatalogData>('catalogo');
  const cart = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [floor, setFloor] = useState('todos');
  const [tab, setTab] = useState<'products' | 'stores'>('products');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  if (loading)
    return (
      <div className="py-24 px-4 text-center">
        <Loading label="Cargando PaseoYa Marketplace…" />
      </div>
    );

  if (error || !data)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto">
        <ErrorState message={error || 'No se pudo cargar el catálogo'} retry={reload} />
      </div>
    );

  const store = data.stores.find((s) => s.id === storeId);
  if (storeId && !store)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto text-center">
        <Empty
          title="Esta tienda no está disponible"
          detail="Explora los demás locales y marcas de Paseo Aranjuez."
          href="/cliente"
        />
      </div>
    );

  const matches = (value: string) => normalize(value).includes(normalize(search));

  const matchesFloor = (st?: Store) => {
    if (floor === 'todos') return true;
    if (!st || !st.floor) return true;
    const f = st.floor.toLowerCase();
    if (floor === 'pb') return f.includes('baja') || f.includes('pb');
    if (floor === 'piso-1') return f.includes('1') || f.includes('primer');
    if (floor === 'piso-2') return f.includes('2') || f.includes('segund');
    if (floor === 'piso-3') return f.includes('3') || f.includes('tercer') || f.includes('comida');
    if (floor === 'piso-4') return f.includes('4') || f.includes('cuarto') || f.includes('terraza');
    return true;
  };

  const products = data.products.filter(
    (p) =>
      (!storeId || p.store_id === storeId) &&
      (!category || p.category === category) &&
      matchesFloor(p.store) &&
      matches(`${p.name} ${p.description} ${p.category} ${p.store?.name}`),
  );

  const stores = data.stores.filter(
    (s) =>
      (!category || s.category === category) &&
      matchesFloor(s) &&
      matches(`${s.name} ${s.description} ${s.category}`),
  );

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = !favorites[productId];
    setFavorites((prev) => ({ ...prev, [productId]: isFav }));
    if (isFav) toast.success('Guardado en tus favoritos');
    else toast.info('Eliminado de favoritos');
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner Luxury */}
      {!store ? (
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
            Retiro en Local · Click & Collect
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-white tracking-tight">
            PaseoYa Marketplace
          </h1>
          <p className="text-white/60 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            Compra en línea a comercios de la torre y retira de inmediato en el local físico con tu código QR y PIN de retiro.
          </p>
        </div>
      ) : (
        /* Store Hero Banner */
        <div className="rounded-3xl glass-andino border border-white/10 p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6B1A]/10 to-[#D4A24C]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <Link
                href="/cliente"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B1A] hover:underline mb-3"
              >
                ← Volver a todas las tiendas
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4A24C]/20 text-[#D4A24C] text-[10px] font-black uppercase tracking-wider border border-[#D4A24C]/30">
                  {store.category}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
                {store.name}
              </h1>
              <p className="text-sm text-white/70 mt-1 max-w-xl">{store.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 mt-4">
                <span className="flex items-center gap-1.5 text-[#D4A24C]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                  {store.floor} · {store.sector} · {store.local_num}
                </span>
                {store.schedule && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    {store.schedule}
                  </span>
                )}
                {store.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    {store.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80">
              <span className="block font-bold text-white mb-0.5">Retiro Click & Collect</span>
              <span className="text-[11px] text-white/60">Listo en mostrador tras comprar</span>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Niveles / Pisos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { key: 'todos', label: 'Todos los Niveles' },
          { key: 'pb', label: 'Planta Baja' },
          { key: 'piso-1', label: 'Piso 1 (Moda)' },
          { key: 'piso-2', label: 'Piso 2 (Deportes/Niños)' },
          { key: 'piso-3', label: 'Piso 3 (Comidas & Juegos)' },
          { key: 'piso-4', label: 'Piso 4 (Terrazas El Cuarto)' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFloor(f.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              floor === f.key
                ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg shadow-[#FF6B1A]/20'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Herramientas de Catálogo: Buscador y Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, marca, tienda o categoría..."
            className="w-full bg-black/40 border border-white/15 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B1A]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!store && (
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'products'
                  ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🛍️ Productos ({products.length})
            </button>
            <button
              onClick={() => setTab('stores')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'stores'
                  ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🏪 Tiendas ({stores.length})
            </button>
          </div>
        )}
      </div>

      {/* Categorías Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => setCategory('')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            !category
              ? 'bg-white text-black font-bold shadow'
              : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
          }`}
        >
          Todo el Paseo
        </button>
        {data.categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === c.id
                ? 'bg-white text-black font-bold shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid de Productos Luxury */}
      {tab === 'products' || store ? (
        products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const pointsEarned = Math.floor(p.price * (data.settings?.points_ratio || 1));
              return (
                <div
                  key={p.id}
                  className="group rounded-3xl glass-andino card-hover-product border border-white/10 overflow-hidden flex flex-col justify-between h-full shadow-lg"
                >
                  <div>
                    {/* Imagen con Badges */}
                    <div className="relative h-56 w-full overflow-hidden bg-black/40">
                      <img
                        src={
                          p.image_url ||
                          'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        {p.category}
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <div className="px-2.5 py-1 rounded-full bg-[#D4A24C] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                          +{pointsEarned} pts
                        </div>
                        <button
                          onClick={(e) => toggleFavorite(p.id, e)}
                          className={`p-1.5 rounded-full backdrop-blur-md bg-black/50 text-white transition-all ${
                            favorites[p.id] ? 'text-red-500 scale-110' : 'hover:scale-110'
                          }`}
                          aria-label="Marcar como favorito"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <Link
                        href={`/cliente/tiendas/${p.store_id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[#D4A24C] font-semibold mb-2 hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                        <span>{p.store?.name || 'Tienda Paseo'}</span>
                        <span className="text-white/40">·</span>
                        <span className="text-white/70">{p.store?.floor || 'Mall'}</span>
                      </Link>

                      <Link href={`/producto/${p.id}`}>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B1A] transition-colors leading-snug">
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase font-semibold">
                        Precio Retiro
                      </span>
                      <span className="text-2xl font-black text-white font-mono tabular-nums">
                        {money(p.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        cart.add(p);
                        toast.success(`Agregado a tu pedido: ${p.name}`);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white btn-primary-andino"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Retirar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Empty
              title="No encontramos productos"
              detail="Prueba cambiando los filtros o el piso seleccionado."
            />
          </div>
        )
      ) : (
        /* Grid de Tiendas Luxury */
        stores.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/cliente/tiendas/${s.id}`}
                className="group rounded-3xl glass-andino card-hover-store border border-white/10 p-6 flex flex-col justify-between h-full shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B84D0B] to-[#FF6B1A] flex items-center justify-center text-white shadow-lg shadow-[#FF6B1A]/20">
                      <StoreIcon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-wider border border-white/10">
                      {s.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-[#FF6B1A] transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                    {s.floor} · {s.local_num}
                  </span>
                  <span className="text-[#FF6B1A] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver local <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Empty
              title="No encontramos tiendas"
              detail="Prueba con otro piso o categoría."
            />
          </div>
        )
      )}
    </div>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useResource<CatalogData>('catalogo');
  const cart = useCart();

  if (loading)
    return (
      <div className="py-24 text-center">
        <Loading label="Cargando producto…" />
      </div>
    );

  if (error || !data)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto">
        <ErrorState message={error || 'Producto no disponible'} retry={reload} />
      </div>
    );

  const p = data.products.find((item) => item.id === id);
  if (!p)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto text-center">
        <Empty
          title="Producto no disponible"
          detail="Explora otras opciones en PaseoYa."
          href="/cliente"
        />
      </div>
    );

  const pointsEarned = Math.floor(p.price * (data.settings?.points_ratio || 1));

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <Link
        href="/cliente"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B1A] hover:underline mb-8"
      >
        ← Volver al Marketplace
      </Link>

      <div className="rounded-3xl glass-andino border border-white/10 overflow-hidden p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Imagen del Producto */}
        <div className="relative rounded-2xl overflow-hidden bg-black/40 h-80 sm:h-96 w-full">
          <img
            src={
              p.image_url ||
              'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
            }
            alt={p.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider">
            {p.category}
          </div>
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#D4A24C] text-black text-xs font-black uppercase tracking-wider shadow-lg">
            +{pointsEarned} pts
          </div>
        </div>

        {/* Información y Compra */}
        <div className="flex flex-col justify-between">
          <div>
            <Link
              href={`/cliente/tiendas/${p.store_id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#D4A24C] font-semibold mb-2 hover:underline"
            >
              <MapPin className="w-4 h-4 text-[#FF6B1A]" />
              <span>{p.store?.name}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">{p.store?.floor} ({p.store?.local_num})</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-display leading-tight mb-3">
              {p.name}
            </h1>

            <p className="text-sm text-white/70 leading-relaxed mb-6">{p.description}</p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-semibold block">
                  Precio de Retiro
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {money(p.price)}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/25 text-xs text-[#D4A24C] mb-6">
              <Gift className="w-5 h-5 flex-shrink-0" />
              <span>
                Al retirar este pedido en Paseo Aranjuez sumas <strong>+{pointsEarned} Paseo Points</strong> en tu cuenta.
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                cart.add(p);
                toast.success(`Agregado a tu pedido: ${p.name}`);
              }}
              disabled={p.stock <= 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] font-bold text-sm text-white hover:opacity-95 shadow-xl shadow-[#FF6B1A]/25 btn-primary-andino flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Agregar al Carrito de Retiro</span>
            </button>

            <div className="text-xs text-white/50 text-center">
              📍 Retiro presencial en {p.store?.floor}, {p.store?.local_num}. Presenta tu código o QR.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Agenda({ data }: { data: CatalogData }) {
  return null;
}
