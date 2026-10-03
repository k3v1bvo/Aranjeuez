'use client';
import { useState } from 'react';
import { Pencil, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Catalog, Store, User } from '@/lib/paseo/model';
import { api, useResource } from './Providers';
import { Empty, ErrorState, Loading, Modal, PageTitle } from './UI';
type Row = Record<string, string | number | boolean | null>;
type Field = {
  key: string;
  label: string;
  type?: string;
  min?: number;
  max?: number;
  optional?: boolean;
};
const common: Field[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción', type: 'textarea' },
];
const configs: Record<string, { title: string; fields: Field[] }> = {
  productos: {
    title: 'Productos',
    fields: [
      ...common,
      { key: 'store_id', label: 'Establecimiento', type: 'store' },
      { key: 'category', label: 'Categoría', type: 'category' },
      { key: 'price', label: 'Precio (Bs.)', type: 'number', min: 0.01, max: 100000 },
      { key: 'stock', label: 'Stock', type: 'integer', min: 0, max: 100000 },
      { key: 'image_url', label: 'URL de imagen (HTTPS)', type: 'url', optional: true },
      { key: 'is_featured', label: 'Destacar en la portada', type: 'checkbox' },
    ],
  },
  tiendas: {
    title: 'Establecimientos',
    fields: [
      ...common,
      { key: 'category', label: 'Categoría', type: 'category' },
      { key: 'owner_id', label: 'Responsable', type: 'owner', optional: true },
      { key: 'floor', label: 'Piso', optional: true },
      { key: 'sector', label: 'Sector', optional: true },
      { key: 'local_num', label: 'Número de local', optional: true },
      { key: 'reference', label: 'Referencia de ubicación', optional: true },
      { key: 'schedule', label: 'Horarios', optional: true },
      { key: 'phone', label: 'Teléfono', optional: true },
      { key: 'image_url', label: 'URL de Logo / Fachada (HTTPS)', type: 'url', optional: true },
    ],
  },
  recompensas: {
    title: 'Recompensas',
    fields: [
      ...common,
      { key: 'store_id', label: 'Establecimiento (opcional)', type: 'store', optional: true },
      { key: 'points_cost', label: 'Costo en puntos', type: 'integer', min: 1, max: 1000000 },
      { key: 'stock', label: 'Stock (-1 = ilimitado)', type: 'integer', min: -1, max: 100000 },
    ],
  },
  promociones: {
    title: 'Promociones',
    fields: [
      { key: 'title', label: 'Título' },
      common[1],
      { key: 'store_id', label: 'Establecimiento', type: 'store' },
      {
        key: 'discount',
        label: 'Descuento % (0 para otras ofertas)',
        type: 'number',
        min: 0,
        max: 100,
      },
      { key: 'start_date', label: 'Desde', type: 'date' },
      { key: 'end_date', label: 'Hasta', type: 'date' },
    ],
  },
  eventos: {
    title: 'Eventos',
    fields: [
      { key: 'title', label: 'Título' },
      common[1],
      { key: 'location', label: 'Lugar' },
      { key: 'starts_at', label: 'Inicio (hora de Bolivia)', type: 'datetime-local' },
      { key: 'ends_at', label: 'Fin (hora de Bolivia)', type: 'datetime-local' },
    ],
  },
  categorias: {
    title: 'Categorías',
    fields: [
      { key: 'id', label: 'Identificador (ej. gastronomia)' },
      { key: 'name', label: 'Nombre visible' },
    ],
  },
  usuarios: {
    title: 'Usuarios',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'role', label: 'Rol', type: 'role' },
    ],
  },
};
const localDate = (value: string) =>
  new Date(new Date(value).getTime() - 4 * 3600000).toISOString().slice(0, 16);
export function ResourceManager({ resource }: { resource: string }) {
  const config = configs[resource];
  const { data, loading, error, reload } = useResource<{ rows: Row[]; stores: Store[] }>(
    'gestion/' + resource,
  );
  const catalog = useResource<Catalog>('catalogo');
  const owners = useResource<{ rows: User[] }>(resource === 'tiendas' ? 'gestion/usuarios' : null);
  const [edit, setEdit] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [query, setQuery] = useState('');
  const ready = !!data && !!catalog.data && (resource !== 'tiendas' || !!owners.data);
  if (!config) return <ErrorState message="Sección no disponible." />;
  function open(row?: Row) {
    const initial: Row = row
      ? { ...row }
      : {
          is_active: true,
          is_featured: false,
          stock: resource === 'recompensas' ? -1 : 0,
          role: 'cliente',
          discount: 0,
          category: catalog.data?.categories[0]?.id || '',
          store_id: data?.stores[0]?.id || '',
        };
    for (const f of config.fields)
      if (f.type === 'datetime-local' && initial[f.key])
        initial[f.key] = localDate(String(initial[f.key]));
    setEdit(initial);
    setCreating(!row);
    setFailure('');
  }
  async function save() {
    if (!edit) return;
    setBusy(true);
    setFailure('');
    const payload = { ...edit };
    for (const f of config.fields) {
      if (f.type === 'integer' || f.type === 'number') payload[f.key] = Number(payload[f.key]);
      if (f.type === 'datetime-local' && payload[f.key])
        payload[f.key] = new Date(String(payload[f.key]) + ':00-04:00').toISOString();
    }
    try {
      await api('gestion/' + resource, {
        method: creating ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      setEdit(null);
      reload();
      catalog.reload();
      toast.success(creating ? 'Registro creado' : 'Cambios guardados');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos guardar.');
    } finally {
      setBusy(false);
    }
  }
  const rows =
    data?.rows.filter((r) =>
      String(r.name || r.title || '')
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="Gestión del Paseo"
        title={config.title}
        description="Los cambios guardados se reflejan en el catálogo y en la información de Jarvis."
      >
        <button className="button small" disabled={!ready} onClick={() => open()}>
          <Plus size={17} /> Crear registro
        </button>
      </PageTitle>
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label={`Buscar ${config.title.toLowerCase()}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${config.title.toLowerCase()}…`}
        />
      </label>
      {error && <ErrorState message={error} retry={reload} />}
      {catalog.error && <ErrorState message={catalog.error} retry={catalog.reload} />}
      {resource === 'tiendas' && owners.error && (
        <ErrorState message={owners.error} retry={owners.reload} />
      )}
      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty title="Sin registros en esta vista" detail="Crea el primero o cambia tu búsqueda." />
      ) : (
        <div className="management-list">
          {rows.map((row) => (
            <article className="management-row" key={String(row.id)}>
              <div>
                <h3>{String(row.name || row.title)}</h3>
                <p className="muted">{String(row.email || row.description || row.id)}</p>
                <div className="inline-meta">
                  {row.store_id && (
                    <span>
                      {data?.stores.find((s) => s.id === row.store_id)?.name || 'Establecimiento'}
                    </span>
                  )}
                  {row.role && <span>{String(row.role)}</span>}
                  {row.stock !== undefined && (
                    <span>Stock: {Number(row.stock) === -1 ? 'ilimitado' : String(row.stock)}</span>
                  )}
                  {row.is_active !== undefined && (
                    <span
                      className={`status ${row.is_active ? 'status-entregado' : 'status-cancelado'}`}
                    >
                      {row.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="button secondary small"
                disabled={!ready}
                onClick={() => open(row)}
                aria-label={`Editar ${row.name || row.title}`}
              >
                <Pencil size={15} /> Editar
              </button>
            </article>
          ))}
        </div>
      )}
      {edit && (
        <Modal
          title={`${creating ? 'Crear' : 'Editar'} · ${config.title}`}
          onClose={() => {
            if (!busy) setEdit(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="form-grid">
              {config.fields.map((f) => {
                const value = String(edit[f.key] ?? '');
                const update = (v: string | boolean) => setEdit({ ...edit, [f.key]: v });
                if (f.type === 'checkbox')
                  return (
                    <label key={f.key} className="checkbox">
                      <input
                        type="checkbox"
                        checked={!!edit[f.key]}
                        onChange={(e) => update(e.target.checked)}
                      />
                      {f.label}
                    </label>
                  );
                const options =
                  f.type === 'store'
                    ? data?.stores.map((s) => [s.id, s.name]) || []
                    : f.type === 'category'
                      ? catalog.data?.categories.map((c) => [c.id, c.name]) || []
                      : f.type === 'owner'
                        ? owners.data?.rows
                            .filter((u) => u.is_active && u.role !== 'cliente')
                            .map((u) => [u.id, `${u.name} · ${u.email}`]) || []
                        : f.type === 'role'
                          ? [
                              ['cliente', 'Cliente'],
                              ['comercio', 'Comercio'],
                              ['admin', 'Administrador'],
                            ]
                          : null;
                return (
                  <label key={f.key} className={f.type === 'textarea' ? 'span-all' : ''}>
                    {f.label}
                    {options ? (
                      <select
                        aria-label={f.label}
                        required={!f.optional}
                        value={value}
                        onChange={(e) => update(e.target.value)}
                      >
                        <option value="">
                          {f.optional ? 'Sin asignar' : 'Selecciona una opción'}
                        </option>
                        {options.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        required={!f.optional}
                        maxLength={1000}
                        rows={3}
                        value={value}
                        onChange={(e) => update(e.target.value)}
                      />
                    ) : (
                      <input
                        disabled={f.key === 'id' && !creating}
                        type={f.type === 'integer' ? 'number' : f.type || 'text'}
                        step={f.type === 'integer' ? 1 : f.type === 'number' ? 0.01 : undefined}
                        min={f.min}
                        max={f.max}
                        maxLength={f.key === 'image_url' ? 1000 : 200}
                        required={!f.optional}
                        value={value}
                        onChange={(e) => update(e.target.value)}
                      />
                    )}
                  </label>
                );
              })}
              {creating && resource === 'usuarios' && (
                <>
                  <label>
                    Correo
                    <input
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="off"
                      value={String(edit.email || '')}
                      onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                    />
                  </label>
                  <label>
                    Contraseña inicial
                    <input
                      type="password"
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      value={String(edit.password || '')}
                      onChange={(e) => setEdit({ ...edit, password: e.target.value })}
                    />
                  </label>
                </>
              )}
              {resource !== 'categorias' && (
                <label className="checkbox span-all">
                  <input
                    type="checkbox"
                    checked={!!edit.is_active}
                    onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })}
                  />
                  Activo
                </label>
              )}
            </div>
            {resource === 'tiendas' && owners.error && <p className="form-error">{owners.error}</p>}
            {failure && (
              <p className="form-error" role="alert">
                {failure}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                disabled={busy}
                onClick={() => setEdit(null)}
              >
                Cancelar
              </button>
              <button className="button" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
