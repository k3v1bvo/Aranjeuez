'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { Plus, Package, Edit, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ImageUploader';
import type { Product } from '@/lib/types';

export default function VendorProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: categories[0]?.id || '',
    price: 39.99,
    stock: 20,
    low_stock_threshold: 5,
    description: '',
    image: '',
  });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      price: 49.99,
      stock: 25,
      low_stock_threshold: 5,
      description: '',
      image: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id || '',
      price: p.price,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      description: p.description || '',
      image: p.images[0] || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        category_id: formData.category_id,
        price: Number(formData.price),
        stock: Number(formData.stock),
        low_stock_threshold: Number(formData.low_stock_threshold),
        description: formData.description,
        image: formData.image,
      });
    } else {
      addProduct({
        name: formData.name,
        category_id: formData.category_id,
        price: Number(formData.price),
        stock: Number(formData.stock),
        low_stock_threshold: Number(formData.low_stock_threshold),
        description: formData.description,
        image: formData.image,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Productos</h1>
          <p className="text-sm text-tactical-400">
            Control de stock, precios y fotos con alojamiento en ImgBB.
          </p>
        </div>
        <button onClick={openNewModal} className="btn-tactical text-xs flex items-center gap-1.5 self-start sm:self-auto">
          <Plus size={15} /> Publicar Producto
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tactical-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en tu inventario..."
          className="input-tactical pl-9 py-2 text-sm"
        />
      </div>

      {/* Product grid / cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const isLow = p.stock <= p.low_stock_threshold && p.stock > 0;
          const isOut = p.stock === 0;

          return (
            <div
              key={p.id}
              className="glass-card-static p-4 flex flex-col justify-between border border-white/[0.06] hover:border-white/[0.12] transition"
            >
              <div>
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-tactical-800 mb-3 border border-white/[0.04]">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-tactical-600">
                      <Package size={32} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-tactical-950/80 backdrop-blur-sm text-[10px] text-amber-accent font-semibold px-2 py-0.5 rounded">
                    {p.category?.name || 'Táctico'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{p.name}</h3>
                <p className="text-xs text-tactical-400 line-clamp-2 mb-3">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-white">Bs. {p.price.toFixed(2)}</div>
                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-alert' : isLow ? 'bg-amber-accent' : 'bg-green-tactical'}`} />
                    <span className={isOut ? 'text-red-alert' : isLow ? 'text-amber-accent' : 'text-tactical-400'}>
                      {p.stock} disponibles
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-tactical-300 hover:text-white transition"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-lg bg-red-alert/10 hover:bg-red-alert/20 text-red-alert transition"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Agregar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card-static w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative border border-white/[0.1] shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-tactical-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'Editar Producto' : 'Publicar Nuevo Producto'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <ImageUploader
                value={formData.image}
                onChange={url => setFormData({ ...formData, image: url })}
                label="Foto del Producto (Alojamiento ImgBB)"
                aspectRatio="square"
              />

              <div>
                <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Guantes Tácticos Anticorte Kevlar"
                  className="input-tactical text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-tactical text-sm"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                    Precio (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="input-tactical text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="input-tactical text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                    Umbral Alerta
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.low_stock_threshold}
                    onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value, 10) || 1 })}
                    className="input-tactical text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Materiales, especificaciones militares, resistencia..."
                  className="input-tactical text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost text-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn-tactical text-sm">
                  {editingProduct ? 'Guardar Cambios' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
