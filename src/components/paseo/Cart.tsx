'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Gift, MapPin, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Catalog, Order } from '@/lib/paseo/model';
import { money } from '@/lib/paseo/model';
import { api, useCart, useResource, useSession } from './Providers';
import { CategoryArt, Empty, ErrorState, PageTitle } from './UI';

export function Cart() {
  const cart = useCart();
  const { user } = useSession();
  const router = useRouter();
  const { data, error: catalogError, reload } = useResource<Catalog>('catalogo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef({ fingerprint: '', key: '' });
  const store = data?.stores.find((s) => s.id === cart.items[0]?.product.store_id);
  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      (data?.products.find((p) => p.id === item.product.id)?.price ?? item.product.price) *
        item.quantity,
    0,
  );
  async function order() {
    setBusy(true);
    setError('');
    const payload = {
      storeId: store?.id,
      items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== request.current.fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    try {
      await api<{ order: Order }>('pedidos', {
        method: 'POST',
        body: JSON.stringify({ ...payload, requestKey: request.current.key }),
      });
      cart.clear();
      toast.success('Pedido recibido. Te esperamos en el Paseo.');
      router.push('/cliente/pedidos');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar el pedido.');
      reload();
    } finally {
      setBusy(false);
    }
  }
  if (!cart.items.length)
    return (
      <div className="container">
        <PageTitle eyebrow="PaseoYa" title="Tu carrito" />
        <Empty
          title="Tu próximo favorito te espera"
          detail="Explora el catálogo y agrega algo que te guste."
          href="/cliente"
        />
      </div>
    );
  return (
    <div className="container">
      <PageTitle
        eyebrow="PaseoYa · Tu próxima visita"
        title="Ya casi es tuyo."
        description="Confirma tu pedido y retíralo en el establecimiento."
      />
      <div className="checkout-grid">
        <section>
          <div className="section-head">
            <h2>{store?.name || 'Tu selección'}</h2>
            <button className="text-button" onClick={cart.clear} disabled={busy}>
              <Trash2 size={15} /> Vaciar
            </button>
          </div>
          {cart.items.map(({ product, quantity }) => (
            <article className="cart-item" key={product.id}>
              <CategoryArt
                category={product.category}
                name={product.name}
                image={product.image_url}
              />
              <div>
                <Link href={`/producto/${product.id}`}>
                  <h3>{product.name}</h3>
                </Link>
                <p>
                  {money(data?.products.find((p) => p.id === product.id)?.price ?? product.price)}
                </p>
                <div className="quantity">
                  <button
                    aria-label={`Quitar una unidad de ${product.name}`}
                    disabled={busy || quantity <= 1}
                    onClick={() => cart.quantity(product.id, quantity - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    aria-label={`Sumar una unidad de ${product.name}`}
                    disabled={busy}
                    onClick={() => cart.quantity(product.id, quantity + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <button
                className="icon-button"
                aria-label={`Quitar ${product.name}`}
                disabled={busy}
                onClick={() => cart.remove(product.id)}
              >
                <Trash2 size={18} />
              </button>
            </article>
          ))}
          <Link className="text-button" href={store ? `/cliente/tiendas/${store.id}` : '/cliente'}>
            Seguir explorando <ArrowRight size={16} />
          </Link>
        </section>
        <aside className="checkout-summary">
          <span className="module-icon sage">
            <ShieldCheck />
          </span>
          <h2>Tu pedido, en el Paseo</h2>
          <div className="summary-line">
            <span>Productos</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="summary-line">
            <span>Retiro presencial</span>
            <strong>Sin costo</strong>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="notice">
            <Gift size={19} />
            <span>
              Sumarás{' '}
              <strong>{Math.floor(total * (data?.settings.points_ratio || 1))} puntos</strong> al
              retirar.
            </span>
          </div>
          <p className="small">
            <MapPin size={15} />{' '}
            {store
              ? `${store.floor} · ${store.sector} · ${store.local_num}`
              : 'Cargando ubicación…'}
            <br />
            {store?.schedule}
          </p>
          <p className="small muted">
            Paga en el establecimiento al retirar. Este pedido reserva tus productos; aún no se ha
            realizado ningún cobro.
          </p>
          {catalogError && <ErrorState message={catalogError} retry={reload} />}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          {!user ? (
            <Link className="button full" href="/auth/login">
              Ingresa para confirmar <ArrowRight size={17} />
            </Link>
          ) : user.role !== 'cliente' ? (
            <p className="notice">Para comprar, ingresa con una cuenta de cliente.</p>
          ) : (
            <button
              className="button full"
              disabled={busy || !store || !!catalogError}
              onClick={order}
            >
              {busy ? 'Confirmando…' : 'Confirmar pedido'} <ArrowRight size={17} />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
