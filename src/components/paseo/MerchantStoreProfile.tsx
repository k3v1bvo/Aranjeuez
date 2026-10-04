'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store as StoreIcon,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Save,
  Package,
  Tag,
  Building2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Catalog, Store } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { ErrorState, Loading, PageTitle } from './UI';
import { ImageDragDropUploader } from './ImageDragDropUploader';

const FLOORS = [
  { id: 'Subsuelo', label: 'Subsuelo (-1)', desc: 'Parking & Click & Collect' },
  { id: 'Planta Baja', label: 'Planta Baja (PB)', desc: 'Lobby & Boulevard' },
  { id: 'Piso 1', label: 'Piso 1', desc: 'Moda & Servicios' },
  { id: 'Piso 2', label: 'Piso 2', desc: 'Patio de Comidas & Ocio' },
  { id: 'Piso 3', label: 'Piso 3 / Terraza', desc: 'Mirador & Restaurantes' },
];

export function MerchantStoreProfile() {
  const { user } = useSession();
  const catalog = useResource<Catalog>('catalogo');
  const { data, loading, error, reload } = useResource<{ rows: Store[]; stores: Store[] }>(
    'gestion/tiendas',
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Local editable store state
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    floor: 'Planta Baja',
    sector: 'Lobby Principal',
    local_num: '',
    reference: '',
    schedule: 'Lunes a Domingo: 10:00 - 22:00',
    phone: '',
    image_url: '',
    is_active: true,
  });

  const existingStore = data?.rows?.[0] || null;

  // Initialize form once data is loaded
  useEffect(() => {
    if (existingStore) {
      // Synchronize the editable form after the store is fetched.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: existingStore.name || '',
        description: existingStore.description || '',
        category: existingStore.category || catalog.data?.categories[0]?.id || '',
        floor: existingStore.floor || 'Planta Baja',
        sector: existingStore.sector || 'Lobby Principal',
        local_num: existingStore.local_num || '',
        reference: existingStore.reference || '',
        schedule: existingStore.schedule || 'Lunes a Domingo: 10:00 - 22:00',
        phone: existingStore.phone || '',
        image_url: existingStore.image_url || '',
        is_active: existingStore.is_active ?? true,
      });
    } else if (catalog.data?.categories?.length) {
      setForm((prev) => ({
        ...prev,
        category: prev.category || catalog.data?.categories[0]?.id || '',
      }));
    }
  }, [existingStore, catalog.data]);

  // Completeness score
  const checks = [
    { label: 'Nombre Comercial', done: Boolean(form.name.trim()) },
    { label: 'Categoría asignada', done: Boolean(form.category) },
    { label: 'Ubicación y Local', done: Boolean(form.floor && form.local_num) },
    { label: 'Horarios de atención', done: Boolean(form.schedule.trim()) },
    { label: 'Teléfono / WhatsApp', done: Boolean(form.phone.trim()) },
    { label: 'Descripción comercial', done: Boolean(form.description.trim()) },
  ];
  const completedCount = checks.filter((c) => c.done).length;
  const progressPct = Math.round((completedCount / checks.length) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (!form.name.trim()) throw new Error('El nombre de la tienda es obligatorio.');
      if (!form.category) throw new Error('Selecciona una categoría.');

      if (existingStore) {
        // Update existing store
        await api('gestion/tiendas', {
          method: 'PATCH',
          body: JSON.stringify({
            id: existingStore.id,
            ...form,
          }),
        });
        toast.success('¡Perfil de establecimiento actualizado con éxito!');
      } else {
        // Create store for this merchant
        await api('gestion/tiendas', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('¡Establecimiento registrado con éxito en Paseo Aranjuez!');
      }

      await reload();
      await catalog.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los datos del local.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading || catalog.loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageTitle
        eyebrow="Panel de Negocio"
        title="Mi Establecimiento"
        description="Gestiona la identidad comercial, horarios y ubicación de tu local en Paseo Aranjuez."
      >
        {existingStore && (
          <Link
            href={`/cliente/tiendas/${existingStore.id}`}
            target="_blank"
            className="button secondary small inline-flex items-center gap-1.5"
          >
            <ExternalLink size={15} /> Ver en Directorio Público
          </Link>
        )}
      </PageTitle>

      {/* Onboarding Welcome Banner if store has no name or is incomplete */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#061734] via-[#0E244D] to-[#061734] border border-[#FF6B1A]/30 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#FF6B1A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B1A]/20 border border-[#FF6B1A]/40 text-[#FF6B1A] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              Comercio Oficial Habilitado
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {existingStore ? existingStore.name : 'Configura tu Negocio en el Paseo'}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mantener actualizados tus horarios, número de local y teléfono permite que los
              visitantes del centro comercial te encuentren al instante y realicen compras mediante{' '}
              <strong className="text-white">PaseoYa (Click & Collect)</strong>.
            </p>
          </div>

          <div className="bg-[#030B1A]/80 border border-white/10 rounded-xl p-4 min-w-[220px]">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-400">Completitud del perfil</span>
              <span className="text-[#FF6B1A] font-bold">{progressPct}%</span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              {checks.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 ${
                    c.done ? 'text-emerald-400 font-medium' : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2
                    size={12}
                    className={c.done ? 'text-emerald-400' : 'text-slate-600'}
                  />
                  <span className="truncate">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Principal (2 Columnas) */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="surface p-6 md:p-8 rounded-2xl border border-white/10 space-y-6 shadow-2xl"
          >
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <StoreIcon className="text-[#FF6B1A]" size={20} />
                Información del Establecimiento
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Datos visibles en la aplicación móvil, catálogo web y asistente Jarvis IA.
              </p>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nombre Comercial / Marca <span className="text-[#FF6B1A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Totto, Café París, Gourmet Grill..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Categoría <span className="text-[#FF6B1A]">*</span>
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecciona una categoría</option>
                    {catalog.data?.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Número de Local
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Local PB-14, Isla 2, Local 204"
                    value={form.local_num}
                    onChange={(e) => setForm({ ...form, local_num: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Selector de Piso */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nivel / Piso en Paseo Aranjuez
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {FLOORS.map((f) => {
                    const active = form.floor === f.id;
                    return (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setForm({ ...form, floor: f.id })}
                        className={`p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center justify-center ${
                          active
                            ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-white font-bold shadow-lg shadow-[#FF6B1A]/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Building2
                          size={16}
                          className={active ? 'text-[#FF6B1A] mb-1' : 'text-slate-500 mb-1'}
                        />
                        <span className="truncate w-full">{f.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Sector del Centro Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Boulevard Pando, Patio de Comidas, Lobby Central"
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Referencia Física
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Frente a gradas eléctricas, al lado de Starbucks"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Horario de Atención
                  </label>
                  <input
                    type="text"
                    placeholder="Lunes a Domingo: 10:00 - 22:00"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Teléfono / WhatsApp de Pedidos
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. +591 70000000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <ImageDragDropUploader
                  value={form.image_url}
                  onChange={(image_url) => setForm({ ...form, image_url })}
                />
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  URL de Imagen de Fachada / Logo (HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... o enlace de foto"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Descripción Comercial
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe la propuesta gastronómica, productos exclusivos, marcas y experiencia que ofrece tu local en Paseo Aranjuez..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#030B1A] border border-white/15 focus:border-[#FF6B1A] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all resize-y"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#FF6B1A] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Establecimiento Activo y Abierto
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Permite que los clientes vean tu tienda en el directorio y realicen pedidos.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={saving}
                className="button primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#FF6B1A]/20"
              >
                <Save size={18} />
                {saving
                  ? 'Guardando cambios...'
                  : existingStore
                    ? 'Guardar Cambios'
                    : 'Registrar Establecimiento'}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Lateral: Previsualización en Vivo & Accesos Rápidos */}
        <div className="space-y-6">
          {/* Card Mockup de Previsualización */}
          <div className="surface p-6 rounded-2xl border border-white/10 shadow-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ImageIcon size={15} className="text-[#FF6B1A]" />
              Vista Previa en el Catálogo
            </h4>

            <div className="rounded-xl overflow-hidden border border-white/15 bg-[#030B1A]/90 group">
              <div className="h-36 bg-gradient-to-tr from-[#061734] to-[#162447] relative overflow-hidden flex items-center justify-center">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt={form.name || 'Tienda'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <StoreIcon size={40} className="text-white/20" />
                )}
                <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/60 backdrop-blur-md text-[#FF6B1A] border border-[#FF6B1A]/40">
                  {catalog.data?.categories.find((c) => c.id === form.category)?.name || 'General'}
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                <h5 className="font-bold text-white text-base truncate">
                  {form.name || 'Nombre de tu Tienda'}
                </h5>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {form.description ||
                    'Aquí se mostrará la descripción comercial de tu establecimiento...'}
                </p>

                <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#FF6B1A] flex-shrink-0" />
                    <span className="truncate">
                      {form.floor} {form.local_num ? `• ${form.local_num}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#D4A24C] flex-shrink-0" />
                    <span className="truncate">{form.schedule}</span>
                  </div>
                  {form.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate text-emerald-400 font-medium">{form.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos de Comercio */}
          <div className="surface p-6 rounded-2xl border border-white/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operaciones de Comercio
            </h4>
            <div className="space-y-2">
              <Link
                href="/comercio/productos"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-semibold text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Package size={16} className="text-[#FF6B1A]" />
                  <span>Gestionar Productos</span>
                </div>
                <span className="text-xs text-slate-400">Ir →</span>
              </Link>
              <Link
                href="/comercio/promociones"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-semibold text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Tag size={16} className="text-[#D4A24C]" />
                  <span>Crear Promociones</span>
                </div>
                <span className="text-xs text-slate-400">Ir →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
