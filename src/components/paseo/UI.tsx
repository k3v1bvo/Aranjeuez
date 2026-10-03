'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  Coffee,
  Gift,
  Headphones,
  ShoppingBag,
  Sparkles,
  X,
  AlertCircle,
  LoaderCircle,
  MapPin,
  Plus,
} from 'lucide-react';
import type { Product } from '@/lib/paseo/model';
import { money } from '@/lib/paseo/model';
import { useCart } from './Providers';

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="state-box" role="status">
      <LoaderCircle className="spin" size={26} />
      <p>{label}</p>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>No pudimos completar la consulta</strong>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Volver a intentar <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({
  title,
  detail,
  href,
  action,
}: {
  title: string;
  detail: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="state-box">
      <ShoppingBag size={32} />
      <h3>{title}</h3>
      <p>{detail}</p>
      {href && (
        <Link className="button secondary" href={href}>
          {action || 'Explorar PaseoYa'} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function CategoryArt({
  category = '',
  name,
  image,
}: {
  category?: string;
  name: string;
  image?: string | null;
}) {
  const Icon = /gastronomia/.test(category)
    ? Coffee
    : /tecnologia/.test(category)
      ? Headphones
      : /regalo/.test(category)
        ? Gift
        : /moda|accesorio/.test(category)
          ? ShoppingBag
          : Sparkles;
  return (
    <div className={`category-art art-${category}`}>
      {image ? (
        <Image unoptimized src={image} alt={name} loading="lazy" width={400} height={300} />
      ) : (
        <>
          <span className="art-circle" />
          <Icon size={70} strokeWidth={1.25} aria-hidden="true" />
          <span className="art-dot" />
        </>
      )}
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  return (
    <article className="product-card">
      <Link
        href={`/producto/${product.id}`}
        className="product-image"
        aria-label={`Ver ${product.name}`}
      >
        <CategoryArt category={product.category} name={product.name} image={product.image_url} />
        {product.is_featured && <span className="tag image-tag">Selección del Paseo</span>}
      </Link>
      <div className="product-body">
        <Link className="store-link" href={`/cliente/tiendas/${product.store_id}`}>
          <MapPin size={12} />
          {product.store?.name || 'Tienda del Paseo'}
        </Link>
        <Link href={`/producto/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <div>
            <strong className="price">{money(product.price)}</strong>
            <small>{product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}</small>
          </div>
          <button
            className="add-button"
            aria-label={`Agregar ${product.name} al carrito`}
            disabled={!product.stock}
            onClick={() => cart.add(product)}
          >
            <Plus size={21} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      close.current();
    };
    dialog?.addEventListener('cancel', cancel);
    return () => {
      dialog?.removeEventListener('cancel', cancel);
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog className="modal" ref={ref} aria-labelledby="modal-title">
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Cerrar ventana" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
