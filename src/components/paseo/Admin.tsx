'use client';
import { PaseoHeatmap } from './PaseoHeatmap';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Coins, Package, ShoppingBag, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Movement, Order, Product, Settings, Store, User } from '@/lib/paseo/model';
import { dateTime, money } from '@/lib/paseo/model';
import { api, useResource } from './Providers';
import { Empty, ErrorState, Loading, PageTitle } from './UI';
import { Orders } from './Orders';
import { ResourceManager } from './Manager';
interface Summary {
  orders: Pick<Order, 'id' | 'user_id' | 'store_id' | 'total' | 'status' | 'created_at'>[];
  purchases: {
    id: string;
    user_id: string;
    store_id: string;
    amount: number;
    points: number;
    created_at: string;
  }[];
  movements: Movement[];
  products: Pick<Product, 'id' | 'name' | 'stock' | 'store_id'>[];
  stores: Store[];
  users: User[];
  questions: { topic: string }[];
  settings: Settings;
  audit: {
    id: string;
    action: string;
    entity: string;
    entity_id: string | null;
    actor_id: string;
    detail: Record<string, unknown>;
    created_at: string;
  }[];
}
function Metrics({ data }: { data: Summary }) {
  const delivered = data.orders.filter((o) => o.status === 'entregado');
  const total =
    delivered.reduce((sum, o) => sum + Number(o.total), 0) +
    data.purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const customers = new Set([
    ...delivered.map((o) => o.user_id),
    ...data.purchases.map((p) => p.user_id),
  ]);
  return (
    <div className="metrics-grid">
      {[
        {
          label: 'Ventas cobradas',
          value: money(total),
          detail: 'Retiros y compras presenciales',
          icon: Coins,
        },
        {
          label: 'Pedidos en curso',
          value: data.orders.filter((o) => !['cancelado', 'entregado'].includes(o.status)).length,
          detail: 'Pendientes de entrega',
          icon: ShoppingBag,
        },
        {
          label: 'Clientes compradores',
          value: customers.size,
          detail: 'Clientes con compras confirmadas',
          icon: Users,
        },
        {
          label: 'Productos con stock bajo',
          value: data.products.filter((p) => p.stock <= 3).length,
          detail: 'Tres unidades o menos',
          icon: Package,
        },
      ].map((m) => (
        <article className="metric-card" key={m.label}>
          <div>
            <span>{m.label}</span>
            <m.icon size={20} />
          </div>
          <strong>{m.value}</strong>
          <small>{m.detail}</small>
        </article>
      ))}
    </div>
  );
}
export function Dashboard({ compact = false }: { compact?: boolean }) {
  const { data, loading, error, reload } = useResource<Summary>('resumen', 30000);
  return (
    <section>
      <PageTitle
        eyebrow={compact ? 'Tu día en el Paseo' : 'Paseo Aranjuez · Administración'}
        title={compact ? 'Todo listo para recibirlos.' : 'Así se mueve el Paseo.'}
        description="Actividad registrada en el sistema. Actualización cada 30 segundos."
      />
      {error && <ErrorState message={error} retry={reload} />}
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <Metrics data={data} />
            {compact && (
              <section className="surface section">
                <h2>Movimientos de mis establecimientos</h2>
                <p className="muted">Últimos 200 movimientos de puntos vinculados a tus locales.</p>
                <ul className="activity-list">
                  {data.movements.map((movement) => (
                    <li key={movement.id}>
                      <div>
                        <strong>{movement.reason}</strong>
                        <small>
                          {movement.user?.name} · {movement.store?.name} ·{' '}
                          {dateTime(movement.created_at)}
                        </small>
                      </div>
                      <strong className={movement.amount > 0 ? 'positive' : ''}>
                        {movement.amount > 0 ? '+' : ''}
                        {movement.amount}
                      </strong>
                    </li>
                  ))}
                </ul>
                {!data.movements.length && (
                  <p className="muted">Las compras y canjes de tus locales aparecerán aquí.</p>
                )}
              </section>
            )}
            {!compact && (
              <>
                <div className="quick-grid">
                  <Link className="card" href="/admin/stores">
                    <ShoppingBag />
                    <h3>Establecimientos</h3>
                    <p>Organiza locales, horarios y responsables.</p>
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link className="card" href="/admin/rewards">
                    <Coins />
                    <h3>Club Paseo</h3>
                    <p>Administra recompensas y disponibilidad.</p>
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link className="card" href="/admin/events">
                    <Users />
                    <h3>Agenda del Paseo</h3>
                    <p>Publica eventos para clientes y Jarvis.</p>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
                <Analytics data={data} />
              </>
            )}
          </>
        )
      )}
    </section>
  );
}
function Analytics({ data }: { data: Summary }) {
  const sales = [
    ...data.orders
      .filter((o) => o.status === 'entregado')
      .map((o) => ({ store_id: o.store_id, user_id: o.user_id, amount: Number(o.total) })),
    ...data.purchases.map((p) => ({ ...p, amount: Number(p.amount) })),
  ];
  const stores = data.stores
    .map((s) => ({
      name: s.name,
      total: sales.filter((p) => p.store_id === s.id).reduce((n, p) => n + p.amount, 0),
      count: sales.filter((p) => p.store_id === s.id).length,
    }))
    .sort((a, b) => b.total - a.total);
  const customers = data.users
    .filter((u) => u.role === 'cliente')
    .map((u) => ({ name: u.name, count: sales.filter((s) => s.user_id === u.id).length }))
    .filter((u) => u.count)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topics = Object.entries(
    data.questions.reduce<Record<string, number>>((counts, q) => {
      counts[q.topic] = (counts[q.topic] || 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <div className="analytics-grid">
      <section className="surface">
        <h2>Ventas por establecimiento</h2>
        <p className="muted">Compras presenciales y pedidos entregados.</p>
        {stores.length ? (
          stores.map((s) => (
            <div className="bar-row" key={s.name}>
              <div>
                <span>{s.name}</span>
                <strong>{money(s.total)}</strong>
              </div>
              <div className="bar-track">
                <span
                  style={{ width: `${stores[0].total ? (s.total / stores[0].total) * 100 : 0}%` }}
                />
              </div>
              <small>{s.count} compras confirmadas</small>
            </div>
          ))
        ) : (
          <p>Aún no hay establecimientos.</p>
        )}
      </section>
      <section className="surface">
        <h2>Clientes que más vuelven</h2>
        <ul className="activity-list">
          {customers.map((u, i) => (
            <li key={i}>
              <strong>{u.name}</strong>
              <span>{u.count} compras</span>
            </li>
          ))}
        </ul>
        {!customers.length && <p className="muted">Aún no hay compras confirmadas.</p>}
        <h3>Consultas a Jarvis</h3>
        <p className="muted">
          Temas de las últimas 1.000 respuestas. No se guardan conversaciones.
        </p>
        <ul className="activity-list">
          {topics.map(([topic, count]) => (
            <li key={topic}>
              <span>{topic}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
        {!topics.length && <p className="muted">Todavía no hay consultas registradas.</p>}
      </section>
    </div>
  );
}
function SettingsForm({ settings }: { settings: Settings }) {
  const [values, setValues] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true);
    setError('');
    try {
      await api('configuracion', { method: 'PATCH', body: JSON.stringify(values) });
      toast.success('Configuración guardada');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="surface settings-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label>
        Nombre del Paseo
        <input
          required
          minLength={2}
          maxLength={100}
          value={values.paseo_name}
          onChange={(e) => setValues({ ...values, paseo_name: e.target.value })}
        />
      </label>
      <label>
        Ubicación y referencia
        <textarea
          required
          minLength={2}
          maxLength={250}
          rows={3}
          value={values.location}
          onChange={(e) => setValues({ ...values, location: e.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          Puntos por Bs. 1
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            required
            value={values.points_ratio}
            onChange={(e) => setValues({ ...values, points_ratio: Number(e.target.value) })}
          />
        </label>
        <label>
          Puntos de bienvenida
          <input
            type="number"
            min="0"
            max="10000"
            step="1"
            required
            value={values.welcome_points}
            onChange={(e) => setValues({ ...values, welcome_points: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="notice">
        La equivalencia se aplica a nuevas compras. Los pedidos existentes conservan los puntos
        calculados cuando se crearon.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </form>
  );
}
function Reports({ section }: { section: string }) {
  const { data, loading, error, reload } = useResource<Summary>('resumen', 30000);
  if (loading) return <Loading />;
  if (!data) return <ErrorState message={error} retry={reload} />;
  const titles: Record<string, string> = {
    analytics: 'Estadísticas del Paseo',
    audit: 'Movimientos y auditoría',
    alerts: 'Alertas de operación',
    settings: 'Configuración del Paseo',
  };
  return (
    <>
      <PageTitle eyebrow="Administración" title={titles[section]} />
      {error && <ErrorState message={error} retry={reload} />}
      {section === 'analytics' && (
        <>
          <Metrics data={data} />
          <div className="my-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <PaseoHeatmap />
          </div>
          <Analytics data={data} />
        </>
      )}
      {section === 'settings' && <SettingsForm settings={data.settings} />}
      {section === 'alerts' && (
        <section className="surface">
          <h2>Reposición de stock</h2>
          <p className="muted">Productos con tres unidades o menos.</p>
          {data.products.filter((p) => p.stock <= 3).length ? (
            <ul className="activity-list">
              {data.products
                .filter((p) => p.stock <= 3)
                .map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <small>{data.stores.find((s) => s.id === p.store_id)?.name}</small>
                    </div>
                    <span className="status status-cancelado">{p.stock} unidades</span>
                  </li>
                ))}
            </ul>
          ) : (
            <Empty
              title="Stock sin alertas"
              detail="Todos los productos tienen más de tres unidades."
            />
          )}
          <Link className="text-button" href="/admin/products">
            Gestionar productos <ArrowUpRight size={16} />
          </Link>
        </section>
      )}
      {section === 'audit' && (
        <>
          <section className="surface">
            <h2>Historial de puntos</h2>
            <p className="muted">Últimos 200 movimientos registrados.</p>
            <ul className="activity-list">
              {data.movements.map((m) => (
                <li key={m.id}>
                  <div>
                    <strong>{m.reason}</strong>
                    <small>
                      {m.user?.name} · {m.store?.name || 'Club Paseo'} · {dateTime(m.created_at)}
                    </small>
                  </div>
                  <strong className={m.amount > 0 ? 'positive' : ''}>
                    {m.amount > 0 ? '+' : ''}
                    {m.amount}
                  </strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="surface section">
            <h2>Auditoría de operaciones</h2>
            <p className="muted">
              Últimas 100 operaciones. Las compras y los canjes se registran dentro de la misma
              transacción.
            </p>
            <ul className="activity-list">
              {data.audit.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.action.replaceAll('_', ' ')}</strong>
                    <small>
                      {data.users.find((u) => u.id === a.actor_id)?.name || 'Usuario'} · {a.entity}{' '}
                      · {dateTime(a.created_at)}
                    </small>
                    <small>
                      {a.entity_id?.slice(0, 8)} {a.detail.despues ? `→ ${a.detail.despues}` : ''}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
export function AdminSection({ section }: { section: string }) {
  const resources: Record<string, string> = {
    stores: 'tiendas',
    products: 'productos',
    users: 'usuarios',
    rewards: 'recompensas',
    promotions: 'promociones',
    events: 'eventos',
    categories: 'categorias',
  };
  if (resources[section]) return <ResourceManager key={section} resource={resources[section]} />;
  if (section === 'overview') return <Dashboard />;
  if (section === 'sales' || section === 'payments') return <Orders commerce />;
  return <Reports key={section} section={section} />;
}
