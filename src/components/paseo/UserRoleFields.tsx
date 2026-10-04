'use client';
import type { Category, Store } from '@/lib/paseo/model';
import { levelFor } from '@/lib/paseo/model';
type Row = Record<string, string | number | boolean | null>;
export function UserRoleFields({
  edit,
  setEdit,
  stores,
  categories,
}: {
  edit: Row;
  setEdit: (row: Row) => void;
  stores: Store[];
  categories: Category[];
}) {
  const update = (key: string, value: string) => setEdit({ ...edit, [key]: value });
  const storeSelect = (
    <label>
      Establecimiento de operación
      <select
        required
        aria-label="Establecimiento de operación"
        value={String(edit.store_id || '')}
        onChange={(e) => update('store_id', e.target.value)}
      >
        <option value="">Selecciona una tienda</option>
        {stores.map((s) => (
          <option value={s.id} key={s.id}>
            {s.name} · Local {s.local_num || 'sin número'}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <label>
        Teléfono / WhatsApp
        <input
          type="tel"
          maxLength={25}
          value={String(edit.phone || '')}
          onChange={(e) => update('phone', e.target.value)}
        />
      </label>
      {edit.role === 'cliente' && (
        <section className="role-fields role-cliente span-all">
          <h3>Fidelidad Paseo Points</h3>
          <label>
            Puntos Paseo
            <input
              type="number"
              required
              min={0}
              max={1000000}
              step={1}
              value={String(edit.points ?? 0)}
              onChange={(e) => update('points', e.target.value)}
            />
          </label>
          <p>
            Nivel VIP: <strong>{levelFor(Number(edit.points || 0)).name}</strong>
          </p>
        </section>
      )}
      {edit.role === 'comercio' && (
        <section className="role-fields role-comercio span-all">
          <h3>Establecimiento comercial</h3>
          {stores
            .filter((s) => s.owner_id === edit.id)
            .map((s) => (
              <p key={s.id}>
                Tienda actualmente vinculada:{' '}
                <strong>
                  {s.name} · Local {s.local_num}
                </strong>
              </p>
            ))}
          <label className="checkbox">
            <input
              type="radio"
              name="store_mode"
              checked={edit.store_mode !== 'new'}
              onChange={() => update('store_mode', 'existing')}
            />
            Asignar a local existente
          </label>
          <label className="checkbox">
            <input
              type="radio"
              name="store_mode"
              checked={edit.store_mode === 'new'}
              onChange={() => update('store_mode', 'new')}
            />
            Crear nuevo local ahora
          </label>
          {edit.store_mode === 'new' ? (
            <div className="form-grid">
              <label>
                Nombre del nuevo local
                <input
                  required
                  maxLength={100}
                  value={String(edit.new_store_name || '')}
                  onChange={(e) => update('new_store_name', e.target.value)}
                />
              </label>
              <label>
                Categoría del nuevo local
                <select
                  required
                  value={String(edit.new_store_category || '')}
                  onChange={(e) => update('new_store_category', e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {(
                [
                  ['floor', 'Piso'],
                  ['local_num', 'Número de local'],
                  ['phone', 'Teléfono de contacto'],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required={key !== 'phone'}
                    maxLength={key === 'phone' ? 25 : 50}
                    value={String(edit['new_store_' + key] || '')}
                    onChange={(e) => update('new_store_' + key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          ) : (
            storeSelect
          )}
        </section>
      )}
      {edit.role === 'empleado' && (
        <section className="role-fields role-empleado span-all">
          <h3>Operaciones de caja</h3>
          {storeSelect}
          <p>Acceso limitado a pedidos, validación de clientes y escáner de este local.</p>
        </section>
      )}
      {edit.role === 'admin' && (
        <section className="role-fields role-admin span-all">
          <h3>Administración general</h3>
          <p>
            Esta cuenta tiene permisos globales sobre la infraestructura digital de Paseo Aranjuez.
          </p>
        </section>
      )}
    </>
  );
}
