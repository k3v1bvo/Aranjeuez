'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Gift,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  CalendarDays,
  Clock,
  X,
} from 'lucide-react';
import type { Catalog as CatalogData } from '@/lib/paseo/model';
import { dateTime, money } from '@/lib/paseo/model';
import { useCart, useResource } from './Providers';
import { CategoryArt, Empty, ErrorState, Loading, PageTitle, ProductCard } from './UI';

export function Home() {
  const { data, error, loading, reload } = useResource<CatalogData>('catalogo');
  const featured = data?.products.filter((product) => product.is_featured) || [];
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-dot" /> Un lugar. Muchas formas de disfrutar.
          </p>
          <h1>
            Tu próximo plan
            <br />
            empieza en <span>el Paseo.</span>
          </h1>
          <p>
            Algo rico, un regalo especial o eso que estabas buscando. Descúbrelo aquí, recógelo en
            el Paseo y suma beneficios.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/cliente">
              Explorar PaseoYa <ArrowUpRight size={18} />
            </Link>
            <Link className="button light" href="/jarvis">
              <Sparkles size={17} /> Encuentra tu plan
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={17} /> Retiro presencial
            </span>
            <span>
              <Gift size={17} /> Cada compra suma
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-label">
            Nos vemos en el Paseo <ArrowUpRight size={17} />
          </div>
          <div className="visual-orbit" />
          <div className="visual-tile tile-coffee">
            <Coffee size={90} strokeWidth={1.3} />
            <span>Una pausa para ti.</span>
          </div>
          <div className="visual-tile tile-bag">
            <ShoppingBag size={104} strokeWidth={1.2} />
            <span>Un nuevo favorito.</span>
          </div>
          <div className="visual-ticket">
            <Gift size={22} />
            <div>
              <strong>Disfruta más. Gana puntos.</strong>
              <small>Tu próxima recompensa te espera</small>
            </div>
          </div>
          <div className="visual-star">
            <Sparkles size={42} />
          </div>
        </div>
      </section>
      <section className="module-strip" aria-label="Todo el Paseo conectado">
        <Link href="/cliente">
          <span className="module-icon lavender">
            <ShoppingBag />
          </span>
          <div>
            <strong>Pide en PaseoYa</strong>
            <small>Elige online. Retira en tu tienda.</small>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link href="/cliente/puntos">
          <span className="module-icon peach">
            <Gift />
          </span>
          <div>
            <strong>Suma Paseo Points</strong>
            <small>Convierte tus compras en beneficios.</small>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link href="/jarvis">
          <span className="module-icon sage">
            <Sparkles />
          </span>
          <div>
            <strong>Pregúntale a Jarvis</strong>
            <small>Ideas y respuestas para tu visita.</small>
          </div>
          <ArrowRight size={18} />
        </Link>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vale la pena descubrir</p>
            <h2>Encuentra tu próximo favorito</h2>
          </div>
          <Link className="text-button" href="/cliente">
            Ver todo <ArrowRight size={17} />
          </Link>
        </div>
        {loading ? (
          <Loading label="Buscando favoritos del Paseo…" />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          <div className="product-grid">
            {(featured.length ? featured : data?.products || []).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {data && !data.products.length && (
          <Empty
            title="El catálogo se está preparando"
            detail="Vuelve pronto para conocer los productos de las tiendas participantes."
          />
        )}
      </section>
      <section className="jarvis-banner">
        <div className="banner-icon">
          <Sparkles size={35} />
        </div>
        <div>
          <p className="eyebrow">Tu asistente del Paseo</p>
          <h2>¿Tienes una idea? Hagamos un plan.</h2>
          <p>
            Un café, un regalo o una tarde diferente. Jarvis te orienta con el catálogo del Paseo.
          </p>
        </div>
        <Link className="button" href="/jarvis">
          Hablar con Jarvis <ArrowUpRight size={17} />
        </Link>
      </section>
      {data && <Agenda data={data} />}
      <section className="visit-note">
        <MapPin size={22} />
        <div>
          <strong>La experiencia continúa en persona</strong>
          <p>
            {data?.settings.location || 'Consulta la ubicación del Paseo con administración.'} ·
            Todos los pedidos se retiran en el establecimiento.
          </p>
        </div>
      </section>
    </div>
  );
}
export function Agenda({ data }: { data: CatalogData }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Más motivos para venir</p>
          <h2>Lo que pasa en el Paseo</h2>
        </div>
      </div>
      <div className="agenda-grid">
        {data.promotions.map((p) => (
          <article key={p.id} className="promo-card">
            <Ticket size={25} />
            <span className="tag">{p.store?.name || 'Paseo Aranjuez'}</span>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <small>Vigente hasta {p.end_date.split('-').reverse().join('/')}</small>
            {p.store_id && (
              <Link className="text-button" href={`/cliente/tiendas/${p.store_id}`}>
                Ver establecimiento <ArrowRight size={16} />
              </Link>
            )}
          </article>
        ))}
        {data.events.map((e) => (
          <article key={e.id} className="event-card">
            <CalendarDays size={25} />
            <span className="tag">En el Paseo</span>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <small>{dateTime(e.starts_at)}</small>
            <small>
              <MapPin size={13} /> {e.location}
            </small>
          </article>
        ))}
      </div>
      {!data.promotions.length && !data.events.length && (
        <p className="muted">
          Por ahora no hay promociones ni eventos publicados. Consulta a Jarvis para planear tu
          visita.
        </p>
      )}
    </section>
  );
}
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
export function Marketplace({ storeId }: { storeId?: string }) {
  const { data, error, loading, reload } = useResource<CatalogData>('catalogo');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tab, setTab] = useState<'products' | 'stores'>('products');
  if (loading)
    return (
      <div className="container">
        <Loading label="Abriendo PaseoYa…" />
      </div>
    );
  if (error || !data)
    return (
      <div className="container section">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  const store = data.stores.find((s) => s.id === storeId);
  if (storeId && !store)
    return (
      <div className="container">
        <Empty
          title="Esta tienda no está disponible"
          detail="Explora los demás establecimientos del Paseo."
          href="/cliente"
        />
      </div>
    );
  const matches = (value: string) => normalize(value).includes(normalize(search));
  const products = data.products.filter(
    (p) =>
      (!storeId || p.store_id === storeId) &&
      (!category || p.category === category) &&
      matches(`${p.name} ${p.description} ${p.category} ${p.store?.name}`),
  );
  const stores = data.stores.filter(
    (s) =>
      (!category || s.category === category) && matches(`${s.name} ${s.description} ${s.category}`),
  );
  return (
    <div className="container">
      <PageTitle
        eyebrow={store ? 'Tu tienda en el Paseo' : 'PaseoYa · Marketplace'}
        title={store?.name || 'Un Paseo, muchas posibilidades.'}
        description={
          store?.description ||
          'Explora productos y establecimientos. Compra aquí y retira en persona.'
        }
      />
      {store && (
        <div className="store-details">
          <span>
            <MapPin size={17} />
            {store.floor} · {store.sector} · {store.local_num}
          </span>
          <span>
            <Clock size={17} />
            {store.schedule || 'Horario por confirmar'}
          </span>
          {store.reference && <span>{store.reference}</span>}
        </div>
      )}
      <div className="catalog-tools">
        <label className="search-field">
          <Search size={21} />
          <span className="sr-only">Buscar productos, tiendas o servicios</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="¿Qué estás buscando hoy?"
          />
          {search && (
            <button
              className="icon-button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={17} />
            </button>
          )}
        </label>
        {!store && (
          <div className="segmented">
            <button
              className={tab === 'products' ? 'active' : ''}
              onClick={() => setTab('products')}
            >
              Productos
            </button>
            <button className={tab === 'stores' ? 'active' : ''} onClick={() => setTab('stores')}>
              Establecimientos
            </button>
          </div>
        )}
      </div>
      <div className="category-filters" aria-label="Categorías">
        <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>
          Todo el Paseo
        </button>
        {data.categories.map((c) => (
          <button
            className={category === c.id ? 'active' : ''}
            onClick={() => setCategory(c.id)}
            key={c.id}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="results-count">
        {tab === 'products' || store
          ? `${products.length} productos para descubrir`
          : `${stores.length} establecimientos`}
        <span>Retiro presencial · Sin costo de envío</span>
      </div>
      {tab === 'products' || store ? (
        products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="No encontramos productos"
            detail="Prueba con otro nombre o cambia la categoría."
          />
        )
      ) : (
        <div className="store-grid">
          {stores.map((s) => (
            <Link className="store-card" href={`/cliente/tiendas/${s.id}`} key={s.id}>
              <CategoryArt category={s.category} name={s.name} />
              <div>
                <span className="eyebrow">
                  {data.categories.find((c) => c.id === s.category)?.name || s.category}
                </span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <small>
                  <MapPin size={13} />
                  {s.floor} · {s.sector} · {s.local_num}
                </small>
                <span className="text-button">
                  Descubrir tienda <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!store && <Agenda data={data} />}
    </div>
  );
}
export function ProductDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useResource<CatalogData>('catalogo');
  const cart = useCart();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="container">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  const p = data?.products.find((p) => p.id === id);
  if (!p)
    return (
      <Empty
        title="Producto no disponible"
        detail="Explora otras opciones en PaseoYa."
        href="/cliente"
      />
    );
  return (
    <div className="container section">
      <Link className="text-button" href={`/cliente/tiendas/${p.store_id}`}>
        ← {p.store?.name}
      </Link>
      <div className="product-detail">
        <CategoryArt category={p.category} name={p.name} image={p.image_url} />
        <div>
          <p className="eyebrow">{p.store?.name}</p>
          <h1>{p.name}</h1>
          <p className="muted">{p.description}</p>
          <p className="detail-price">{money(p.price)}</p>
          <p>{p.stock} unidades disponibles</p>
          <div className="notice">
            <Gift size={20} />
            Suma {Math.floor(p.price * (data?.settings.points_ratio || 1))} puntos al retirar tu
            compra.
          </div>
          <button className="button" disabled={!p.stock} onClick={() => cart.add(p)}>
            Agregar al carrito <ShoppingBag size={18} />
          </button>
          <p className="small muted">
            <MapPin size={15} /> Retiro en {p.store?.floor}, {p.store?.sector}, {p.store?.local_num}
            .<br />
            {p.store?.schedule}
          </p>
        </div>
      </div>
    </div>
  );
}
