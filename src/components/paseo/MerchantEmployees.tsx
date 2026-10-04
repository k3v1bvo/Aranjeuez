'use client';
import { useState } from 'react';
import type { Store, User } from '@/lib/paseo/model';
import { api, useResource } from './Providers';
import { ErrorState, Loading, PageTitle } from './UI';
export function MerchantEmployees() {
  const { data, loading, error, reload } = useResource<{ rows: User[]; stores: Store[] }>(
    'empleados',
    15000,
  );
  const [mode, setMode] = useState('link');
  const [store, setStore] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  async function mutate(payload: Record<string, unknown>, method = 'POST') {
    setBusy(true);
    setFailure('');
    try {
      await api('empleados', { method, body: JSON.stringify(payload) });
      reload();
      return true;
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No se pudo guardar.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!data) return <ErrorState message={error} retry={reload} />;
  const selected = store || data.stores[0]?.id || '';
  const rows = data.rows.filter((u) => u.avatar_url === 'store:' + selected);
  return (
    <>
      <PageTitle
        title="Mi equipo"
        eyebrow="Gestión de colaboradores"
        description="Vincula personal a tu local y administra su acceso a caja."
      />
      <label>
        Mi establecimiento
        <select value={selected} onChange={(e) => setStore(e.target.value)}>
          {data.stores.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        {rows.length} colaboradores · {rows.filter((u) => u.is_active).length} activos
      </p>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <section className="surface">
        <div className="tabs">
          <button onClick={() => setMode('link')} className={mode === 'link' ? 'active' : ''}>
            Vincular cliente existente
          </button>
          <button onClick={() => setMode('create')} className={mode === 'create' ? 'active' : ''}>
            Crear nueva cuenta
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fields = Object.fromEntries(new FormData(form));
            if (await mutate({ ...fields, action: mode, store_id: selected })) form.reset();
          }}
        >
          <label>
            Correo electrónico
            <input name="email" type="email" required maxLength={254} />
          </label>
          {mode === 'create' && (
            <>
              <label>
                Nombre completo
                <input name="name" required minLength={2} maxLength={80} />
              </label>
              <label>
                Celular
                <input name="phone" type="tel" maxLength={25} />
              </label>
              <label>
                Contraseña inicial
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </label>
            </>
          )}
          <button className="button" disabled={busy || !selected}>
            {busy ? 'Guardando…' : 'Agregar empleado'}
          </button>
        </form>
      </section>
      <div className="management-list">
        {rows.map((u) => (
          <article className="management-row" key={u.id}>
            <div>
              <h3>{u.name}</h3>
              <p>{u.email}</p>
              <small>{u.is_active ? 'Activo' : 'Pausado'}</small>
            </div>
            <div className="form-actions">
              <button
                className="button secondary small"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    { id: u.id, store_id: selected, action: 'status', is_active: !u.is_active },
                    'PATCH',
                  )
                }
              >
                {u.is_active ? 'Pausar' : 'Activar'}
              </button>
              <button
                className="button secondary small"
                disabled={busy}
                onClick={() =>
                  void mutate({ id: u.id, store_id: selected, action: 'release' }, 'PATCH')
                }
              >
                Volver a Cliente
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
