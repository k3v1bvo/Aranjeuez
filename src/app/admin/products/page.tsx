'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, ToggleLeft, ToggleRight, X, FolderPlus, Tag, ImageIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ImageUploader';
import type { Product, Category } from '@/lib/types';

export default function AdminProductsPage() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    category_id: string;
    price: number;
    cost_price: number;
    stock: number;
    low_stock_threshold: number;
    description: string;
    images: string[];
    is_active: boolean;
  }>({
    name: '',
    category_id: categories[0]?.id || '',
    price: 250.00,
    cost_price: 0,
    stock: 15,
    low_stock_threshold: 5,
    description: '',
    images: [],
    is_active: true,
  });

  const [manualImageUrl, setManualImageUrl] = useState('');

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') result = result.filter(p => p.category_id === categoryFilter);
    if (stockFilter === 'low') result = result.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0);
    if (stockFilter === 'out') result = result.filter(p => p.stock === 0);
    return result;
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // PRODUCT HANDLERS
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: categories[0]?.id || '',
      price: 250.00,
      cost_price: 0,
      stock: 15,
      low_stock_threshold: 5,
      description: '',
      images: [],
      is_active: true,
    });
    setManualImageUrl('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    const existingImages = Array.isArray(p.images) && p.images.length > 0
      ? [...p.images]
      : (p.images?.[0] ? [p.images[0]] : []);

    setProductForm({
      name: p.name,
      category_id: p.category_id || (categories[0]?.id || ''),
      price: p.price,
      cost_price: p.cost_price ?? 0,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      description: p.description || '',
      images: existingImages,
      is_active: p.is_active,
    });
    setManualImageUrl('');
    setIsProductModalOpen(true);
  };

  const handleAddImage = (url: string) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    if (productForm.images.includes(cleanUrl)) {
      toast.info('Esta foto ya está agregada');
      return;
    }
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, cleanUrl],
    }));
    toast.success('Foto agregada a la galería');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setProductForm(prev => {
      const selected = prev.images[indexToPrimary];
      const rest = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [selected, ...rest],
      };
    });
    toast.success('Foto marcada como portada principal');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: productForm.name,
        category_id: productForm.category_id,
        price: Number(productForm.price),
        cost_price: Number(productForm.cost_price),
        stock: Number(productForm.stock),
        low_stock_threshold: Number(productForm.low_stock_threshold),
        description: productForm.description,
        images: productForm.images,
        image: productForm.images[0] || '',
        is_active: productForm.is_active,
      });
    } else {
      addProduct({
        name: productForm.name,
        category_id: productForm.category_id,
        price: Number(productForm.price),
        cost_price: Number(productForm.cost_price),
        stock: Number(productForm.stock),
        low_stock_threshold: Number(productForm.low_stock_threshold),
        description: productForm.description,
        images: productForm.images,
        image: productForm.images[0] || '',
      });
    }
    setIsProductModalOpen(false);
  };

  const handleToggleProductActive = (p: Product) => {
    updateProduct(p.id, { is_active: !p.is_active });
    toast.info(`Producto ${!p.is_active ? 'activado' : 'desactivado'}`);
  };

  // CATEGORY HANDLERS
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryForm.name,
        description: categoryForm.description,
      });
    } else {
      addCategory({
        name: categoryForm.name,
        description: categoryForm.description,
      });
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    const count = products.filter(p => p.category_id === cat.id).length;
    if (count > 0) {
      toast.error(`No se puede eliminar "${cat.name}": tiene ${count} producto(s) asignado(s). Reasigna o elimina los productos primero.`);
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.name}" del catálogo?`)) {
      deleteCategory(cat.id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo & Inventario Arsenal</h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA]">
            Administración en vivo de productos, categorías e imágenes sincronizadas con ImgBB.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openNewCategoryModal} className="btn-outline-gold text-xs flex items-center gap-1.5 py-2.5">
            <FolderPlus size={14} /> Nueva Categoría
          </button>
          <button onClick={openNewProductModal} className="btn-tactical text-xs flex items-center gap-1.5 py-2.5">
            <Plus size={15} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stock Alerts Pill */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/10 text-xs">
              <AlertTriangle size={15} className="text-[#F5A623]" />
              <span className="text-[#F5A623] font-mono font-semibold">{lowStockCount} producto(s) con stock crítico</span>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5484D]/30 bg-[#E5484D]/10 text-xs">
              <Package size={15} className="text-[#E5484D]" />
              <span className="text-[#E5484D] font-mono font-semibold">{outOfStockCount} producto(s) totalmente agotados</span>
            </div>
          )}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-[#141416] p-4 rounded-xl border border-[#26262A] flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B72]" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o código..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-[#C8A961] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#1C1C1F] border border-[#26262A] text-xs text-[#A1A1AA] rounded-lg px-3 py-2.5 focus:border-[#C8A961] focus:outline-none"
          >
            <option value="all">Todas las categorías ({categories.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="bg-[#1C1C1F] border border-[#26262A] text-xs text-[#A1A1AA] rounded-lg px-3 py-2.5 focus:border-[#C8A961] focus:outline-none"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Stock crítico</option>
            <option value="out">Agotados</option>
          </select>
        </div>
      </div>

      {/* Products Table & Mobile Cards */}
      <div className="bg-[#141416] border border-[#26262A] rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile Cards (Visible on screens < sm) */}
        <div className="block sm:hidden divide-y divide-[#26262A]">
          {filteredProducts.map(product => {
            const isLow = product.stock <= product.low_stock_threshold && product.stock > 0;
            const isOut = product.stock === 0;

            return (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#1C1C1F] border border-[#26262A] flex-shrink-0">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6B6B72]">
                        <Package size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] text-[#A1A1AA] font-mono">
                        {categories.find(c => c.id === product.category_id)?.name || 'General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${product.is_active ? 'bg-[#30A46C]/15 text-[#30A46C]' : 'bg-[#E5484D]/15 text-[#E5484D]'}`}>
                        {product.is_active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-[#C8A961] text-sm">
                        Bs. {product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-[#E5484D]' : isLow ? 'bg-[#F5A623] animate-pulse' : 'bg-[#30A46C]'}`} />
                        <span className={`font-mono text-[11px] font-semibold ${isOut ? 'text-[#E5484D]' : isLow ? 'text-[#F5A623]' : 'text-neutral-300'}`}>
                          {product.stock} uds
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#26262A]">
                  <button
                    onClick={() => openEditProductModal(product)}
                    className="flex-1 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Edit size={13} className="text-[#C8A961]" /> Editar
                  </button>

                  <button
                    onClick={() => handleToggleProductActive(product)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                      product.is_active
                        ? 'border-[#30A46C]/30 text-[#30A46C] hover:bg-[#30A46C]/10'
                        : 'border-[#6B6B72]/30 text-[#6B6B72] hover:bg-white/[0.04]'
                    }`}
                  >
                    {product.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    <span className="text-[10px] font-mono">{product.is_active ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#E5484D] transition active:scale-95"
                    title="Eliminar producto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-[#6B6B72] text-xs">
              No se encontraron productos coincidentes con los filtros.
            </div>
          )}
        </div>

        {/* Desktop Table (hidden on sm:hidden) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#26262A] bg-[#0E0E10] text-[#6B6B72] font-mono uppercase tracking-wider">
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Costo</th>
                <th className="py-3.5 px-4">Precio Venta</th>
                <th className="py-3.5 px-4">Margen</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26262A]">
              {filteredProducts.map(product => {
                const isLow = product.stock <= product.low_stock_threshold && product.stock > 0;
                const isOut = product.stock === 0;

                return (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#1C1C1F] border border-[#26262A] flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#6B6B72]">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[240px]">{product.name}</div>
                          <div className="text-[10px] text-[#6B6B72] font-mono">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA]">
                      <span className="px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#26262A] text-[11px]">
                        {product.category?.name || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#A1A1AA] text-xs">
                      {product.cost_price && product.cost_price > 0 ? (
                        <span className="text-[#A1A1AA]">Bs. {product.cost_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-[#3A3A45] italic text-[10px]">no reg.</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                      Bs. {product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {product.cost_price && product.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#30A46C] text-xs">
                            +Bs. {(product.price - product.cost_price).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#6B6B72] font-mono">
                            {Math.round(((product.price - product.cost_price) / product.price) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#3A3A45] italic text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-[#E5484D]' : isLow ? 'bg-[#F5A623] animate-pulse' : 'bg-[#30A46C]'}`} />
                        <span className={`font-mono font-semibold ${isOut ? 'text-[#E5484D]' : isLow ? 'text-[#F5A623]' : 'text-white'}`}>
                          {product.stock} uds
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${product.is_active ? 'bg-[#30A46C]/15 text-[#30A46C]' : 'bg-[#E5484D]/15 text-[#E5484D]'}`}>
                        {product.is_active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditProductModal(product)}
                          className="p-1.5 rounded hover:bg-white/[0.06] text-[#A1A1AA] hover:text-white transition"
                          title="Editar producto"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleProductActive(product)}
                          className="p-1.5 rounded hover:bg-white/[0.06] transition"
                          title={product.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {product.is_active ? (
                            <ToggleRight size={17} className="text-[#30A46C]" />
                          ) : (
                            <ToggleLeft size={17} className="text-[#6B6B72]" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-[#6B6B72] hover:text-[#E5484D] transition"
                          title="Eliminar producto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Management Section */}
      <div className="bg-[#141416] border border-[#26262A] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tag size={16} className="text-[#C8A961]" /> Gestión de Categorías ({categories.length})
            </h2>
            <p className="text-xs text-[#6B6B72]">
              Crea, edita o retira categorías. Toda modificación se sincroniza inmediatamente en la tienda.
            </p>
          </div>
          <button onClick={openNewCategoryModal} className="btn-tactical text-xs flex items-center gap-1.5 py-1.5">
            <Plus size={14} /> Crear Categoría
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-[#1C1C1F] border border-[#26262A] hover:border-[#3A3A40] flex items-center justify-between transition"
              >
                <div>
                  <div className="font-bold text-white text-sm">{cat.name}</div>
                  <div className="text-[11px] text-[#6B6B72] font-mono mt-0.5">
                    {count} productos asignados
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-[#A1A1AA] hover:text-white transition"
                    title="Editar categoría"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[#6B6B72] hover:text-[#E5484D] transition"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL PRODUCTO (CREAR / EDITAR) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#141416] border border-[#3A3A40] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative shadow-2xl">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#A1A1AA] hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-4">
              {editingProduct ? 'Editar Producto Táctico' : 'Nuevo Producto Táctico'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Multi-Photo Manager Section */}
              <div className="p-4 rounded-xl bg-[#14141A] border border-[#26262A] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-[#C8A961]" />
                      Galería de Fotos del Producto ({productForm.images.length})
                    </label>
                    <p className="text-[11px] text-[#6B6B72]">
                      Sube múltiples fotos para mostrar todos los ángulos y detalles al cliente.
                    </p>
                  </div>
                </div>

                {/* Storage & Optimization notice */}
                <div className="p-2.5 rounded-lg bg-[#C8A961]/10 border border-[#C8A961]/25 text-[11px] text-[#D4D4D8] flex items-start gap-2">
                  <span className="text-[#C8A961] font-bold shrink-0">⚡ ImgBB + Supabase:</span>
                  <span>
                    Las fotos se guardan en <strong>ImgBB</strong> en alta calidad y en <strong>Supabase</strong> solo se registra el enlace URL. ¡Ahorra espacio y acelera la tienda!
                  </span>
                </div>

                {/* Existing Images Grid */}
                {productForm.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {productForm.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden aspect-square border ${
                          idx === 0
                            ? 'border-[#C8A961] ring-2 ring-[#C8A961]/30 shadow-lg'
                            : 'border-[#26262A] bg-[#1C1C1F]'
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                        {/* Overlay tags */}
                        <div className="absolute top-1.5 left-1.5 z-10">
                          {idx === 0 ? (
                            <span className="bg-[#C8A961] text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                              PORTADA
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="bg-black/80 hover:bg-[#C8A961] text-white hover:text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition shadow"
                              title="Convertir en foto principal"
                            >
                              Portada
                            </button>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow transition"
                          title="Eliminar foto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Uploader widget: uploading appends to images */}
                <div className="pt-2">
                  <ImageUploader
                    onChange={url => handleAddImage(url)}
                    label="Subir foto desde dispositivo a ImgBB"
                    aspectRatio="square"
                  />
                </div>

                {/* Direct URL input fallback */}
                <div className="pt-1">
                  <label className="block text-[10px] font-mono text-[#7A7A85] uppercase mb-1">
                    O pegar enlace directo de imagen (HTTPS)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={e => setManualImageUrl(e.target.value)}
                      placeholder="https://i.ibb.co/... o https://images.unsplash.com/..."
                      className="flex-1 bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3 py-2 focus:border-[#C8A961] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualImageUrl.trim()) {
                          handleAddImage(manualImageUrl.trim());
                          setManualImageUrl('');
                        }
                      }}
                      className="btn-outline-gold text-xs px-3 py-2 shrink-0"
                    >
                      + Añadir URL
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ej. Mochila Táctica 45L Cordura"
                  className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3 py-2.5 focus:border-[#C8A961] focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                    Precio Venta (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* ADMIN-ONLY: Precio de Costo */}
              <div className="p-3 rounded-xl bg-[#C8A961]/5 border border-[#C8A961]/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono font-bold text-[#C8A961] uppercase tracking-widest bg-[#C8A961]/10 px-2 py-0.5 rounded">🔒 Solo Admin</span>
                  <span className="text-[10px] text-[#6B6B72]">No visible al público ni al chatbot</span>
                </div>
                <label className="block text-xs font-semibold text-[#C8A961] uppercase tracking-wider mb-1">
                  Precio de Costo al Proveedor (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.cost_price}
                  onChange={e => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej. 1150.00 (lo que pagaste al proveedor)"
                  className="w-full bg-[#1C1C1F] border border-[#C8A961]/30 text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none font-mono"
                />
                {productForm.cost_price > 0 && productForm.price > 0 && (
                  <div className="mt-2 text-[10px] font-mono text-[#30A46C]">
                    Margen: Bs. {(productForm.price - productForm.cost_price).toFixed(2)} ({Math.round(((productForm.price - productForm.cost_price) / productForm.price) * 100)}% sobre precio venta)
                  </div>
                )}
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                    Umbral Alerta Stock Bajo
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.low_stock_threshold}
                    onChange={e => setProductForm({ ...productForm, low_stock_threshold: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Descripción & Especificaciones Tácticas
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Materiales, especificaciones balísticas y características..."
                  className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg p-3 focus:border-[#C8A961] focus:outline-none"
                />
              </div>

              <div className="sticky bottom-0 bg-[#141416]/95 backdrop-blur-md -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-[#26262A] flex justify-end gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn-outline-gold text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-tactical text-xs px-5">
                  {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA (CREAR / EDITAR) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#141416] border border-[#3A3A40] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative shadow-2xl">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#A1A1AA] hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría Táctica'}
            </h2>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ej. Protección Balística"
                  className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg px-3.5 py-2.5 focus:border-[#C8A961] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Propósito del equipamiento clasificado en este grupo..."
                  className="w-full bg-[#1C1C1F] border border-[#26262A] text-xs text-white rounded-lg p-3 focus:border-[#C8A961] focus:outline-none"
                />
              </div>

              <div className="sticky bottom-0 bg-[#141416]/95 backdrop-blur-md -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 border-t border-[#26262A] flex justify-end gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="btn-outline-gold text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-tactical text-xs px-5">
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
