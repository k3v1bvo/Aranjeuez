'use client';
import { PaseoHeatmap } from './PaseoHeatmap';
import { PaseoCorporateAnalytics } from './PaseoCorporateAnalytics';
import { QrStationManager } from './QrStationManager';
import { QrCode, Flame } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Coins, Package, ShoppingBag, Users, MapPin, Compass, Award, Sparkles } from 'lucide-react';
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
                <PaseoCorporateAnalytics data={data} mode="compact" />
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
  const [activeTab, setActiveTab] = useState<'ventas' | 'jarvis' | 'clientes'>('ventas');

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

  const totalSalesRevenue = stores.reduce((acc, s) => acc + s.total, 0);
  const maxStoreTotal = stores[0]?.total || 1;

  const customers = data.users
    .filter((u) => u.role === 'cliente')
    .map((u) => ({
      id: u.id,
      name: u.name,
      points: u.points,
      count: sales.filter((s) => s.user_id === u.id).length,
    }))
    .filter((u) => u.count > 0 || u.points > 0)
    .sort((a, b) => (b.count * 100 + b.points) - (a.count * 100 + a.points))
    .slice(0, 8);

  const topics = Object.entries(
    data.questions.reduce<Record<string, number>>((counts, q) => {
      counts[q.topic] = (counts[q.topic] || 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const maxTopicCount = topics[0]?.[1] || 1;
  const totalQuestions = topics.reduce((acc, t) => acc + t[1], 0);

  const barColors = [
    'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
    'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)',
    'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    'linear-gradient(90deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)',
  ];

  return (
    <div className="dashboard-analytics-container">
      <div className="analytics-tabs-header">
        <div className="tabs-nav">
          <button
            type="button"
            className={'tab-btn ' + (activeTab === 'ventas' ? 'active' : '')}
            onClick={() => setActiveTab('ventas')}
          >
            <Coins size={16} /> Rendimiento de Comercios
          </button>
          <button
            type="button"
            className={'tab-btn ' + (activeTab === 'jarvis' ? 'active' : '')}
            onClick={() => setActiveTab('jarvis')}
          >
            <Sparkles size={16} /> Radar de Inteligencia Jarvis
          </button>
          <button
            type="button"
            className={'tab-btn ' + (activeTab === 'clientes' ? 'active' : '')}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={16} /> Fidelización de Clientes
          </button>
        </div>
        <div className="data-badge-live">
          <span className="live-dot"></span> Métricas en Vivo
        </div>
      </div>

      {activeTab === 'ventas' && (
        <div className="analytics-grid modern-grid">
          <section className="surface chart-card">
            <div className="card-header-flex">
              <div>
                <h3>📊 Distribución de Ventas por Establecimiento</h3>
                <p className="muted">Comparativa de ingresos confirmados y volumen de compras</p>
              </div>
              <div className="metric-pill">
                Total: <strong>{money(totalSalesRevenue)}</strong>
              </div>
            </div>

            {stores.length ? (
              <div className="charts-bars-list">
                {stores.map((s, index) => {
                  const pct = totalSalesRevenue > 0 ? Math.round((s.total / totalSalesRevenue) * 100) : 0;
                  const barWidth = Math.max(4, Math.round((s.total / maxStoreTotal) * 100));
                  return (
                    <div className="visual-bar-item" key={s.name}>
                      <div className="visual-bar-label">
                        <div className="bar-title-wrap">
                          <span className="rank-badge">#{index + 1}</span>
                          <strong>{s.name}</strong>
                        </div>
                        <div className="bar-values">
                          <span className="amount">{money(s.total)}</span>
                          <span className="pct-tag">{pct}%</span>
                        </div>
                      </div>
                      <div className="visual-bar-track">
                        <div
                          className="visual-bar-fill"
                          style={{
                            width: barWidth + '%',
                            background: barColors[index % barColors.length],
                          }}
                        />
                      </div>
                      <div className="visual-bar-footer">
                        <span>{s.count} transacciones</span>
                        <span>Promedio: {s.count ? money(s.total / s.count) : 'Bs. 0'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart-notice">Aún no hay ventas registradas en los comercios.</div>
            )}
          </section>

          <section className="surface chart-card donut-section">
            <div className="card-header-flex">
              <div>
                <h3>🥧 Participación de Mercado</h3>
                <p className="muted">Aporte de cada comercio a la facturación</p>
              </div>
            </div>

            {stores.filter((s) => s.total > 0).length ? (
              <div className="donut-visual-container">
                <div className="donut-legend">
                  {stores
                    .filter((s) => s.total > 0)
                    .map((s, i) => (
                      <div className="donut-legend-item" key={s.name}>
                        <span
                          className="legend-dot"
                          style={{ background: barColors[i % barColors.length] }}
                        />
                        <span className="legend-name">{s.name}</span>
                        <strong className="legend-val">{money(s.total)}</strong>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart-notice">Registra transacciones para generar la cuota de mercado.</div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'jarvis' && (
        <div className="analytics-grid modern-grid">
          <section className="surface chart-card">
            <div className="card-header-flex">
              <div>
                <h3>🔍 Consultas y Tendencias de Búsqueda</h3>
                <p className="muted">Temas más recurrentes procesados por el motor de IA en el Paseo</p>
              </div>
              <div className="metric-pill purple">{totalQuestions} consultas</div>
            </div>

            {topics.length ? (
              <div className="charts-bars-list">
                {topics.map(([topic, count]) => {
                  const pct = Math.round((count / maxTopicCount) * 100);
                  return (
                    <div className="visual-bar-item" key={topic}>
                      <div className="visual-bar-label">
                        <div className="bar-title-wrap">
                          <span className="topic-tag">🔍 {topic}</span>
                        </div>
                        <span className="amount">{count} consultas</span>
                      </div>
                      <div className="visual-bar-track">
                        <div
                          className="visual-bar-fill purple"
                          style={{ width: Math.max(5, pct) + '%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart-notice">Aún no se han registrado conversaciones con Jarvis.</div>
            )}
          </section>

          <section className="surface chart-card">
            <h3>⚡ Resumen Operativo</h3>
            <p className="muted">Datos en tiempo real</p>
            <div className="insights-grid">
              <div className="insight-stat-box">
                <span>Top Categoría</span>
                <strong>{topics[0]?.[0] || 'En espera'}</strong>
              </div>
              <div className="insight-stat-box">
                <span>Locales Activos</span>
                <strong>{data.stores.filter((s) => s.is_active).length} activos</strong>
              </div>
              <div className="insight-stat-box">
                <span>Catálogo Total</span>
                <strong>{data.products.length} productos</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="analytics-grid modern-grid">
          <section className="surface chart-card span-2">
            <div className="card-header-flex">
              <div>
                <h3>🏆 Clientes con Mayor Frecuencia y Puntos Club</h3>
                <p className="muted">Ranking de usuarios con mayor fidelizaci?n en el Paseo</p>
              </div>
            </div>

            {customers.length ? (
              <div className="ranking-table-wrapper">
                <table className="modern-ranking-table">
                  <thead>
                    <tr>
                      <th>Posición</th>
                      <th>Cliente</th>
                      <th>Pedidos / Compras</th>
                      <th>Puntos Acumulados</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.id}>
                        <td>
                          <span className={'rank-badge rank-' + (i + 1)}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}
                          </span>
                        </td>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>
                          <span className="purchases-badge">{c.count} compras</span>
                        </td>
                        <td>
                          <strong className="points-highlight">🪙 {c.points} pts</strong>
                        </td>
                        <td>
                          <span className="status-pill active">Activo</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-chart-notice">Aún no hay clientes con actividad confirmada.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const [values, setValues] = useState<Settings>({
    ...settings,
    geofence_radius: settings.geofence_radius ?? 200,
    geofence_lat: settings.geofence_lat ?? -17.37365,
    geofence_lng: settings.geofence_lng ?? -66.15582,
    geofence_strict: settings.geofence_strict ?? false,
    qr_welcome_points: settings.qr_welcome_points ?? 5,
    qr_entry_points: settings.qr_entry_points ?? 1,
    qr_exit_points: settings.qr_exit_points ?? 2,
    qr_min_minutes: settings.qr_min_minutes ?? 2,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [testingGps, setTestingGps] = useState(false);

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api('configuracion', { method: 'PATCH', body: JSON.stringify(values) });
      toast.success('Configuración guardada correctamente');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar.');
    } finally {
      setBusy(false);
    }
  }

  function testDeviceGps() {
    if (!navigator.geolocation) {
      setGpsStatus('La geolocalización no está soportada en este navegador.');
      return;
    }
    setTestingGps(true);
    setGpsStatus('Obteniendo coordenadas GPS de tu dispositivo...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTestingGps(false);
        const { latitude, longitude } = pos.coords;
        const R = 6371e3;
        const phi1 = (latitude * Math.PI) / 180;
        const phi2 = ((values.geofence_lat ?? -17.37365) * Math.PI) / 180;
        const deltaPhi = (((values.geofence_lat ?? -17.37365) - latitude) * Math.PI) / 180;
        const deltaLambda = (((values.geofence_lng ?? -66.15582) - longitude) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = Math.round(R * c);

        const radius = values.geofence_radius ?? 200;
        const inside = dist <= radius;
        setGpsStatus(
          inside
            ? `🟢 ¡Estás dentro del perímetro! Distancia actual: ${dist} metros del Paseo Aranjuez (Radio permitido: ${radius}m).`
            : `⚠️ Fuera del perímetro: Tu dispositivo está a ${dist} metros del Paseo Aranjuez (Radio permitido: ${radius}m).`
        );
      },
      (err) => {
        setTestingGps(false);
        setGpsStatus(`No se pudo obtener GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form
      className="surface settings-form space-y-6"
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
        Ubicación y referencia física
        <textarea
          required
          minLength={2}
          maxLength={250}
          rows={2}
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

      {/* Sección Geocerca y Telemetría */}
      <div className="p-5 rounded-2xl bg-white/5 border border-[#FF6B1A]/30 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <MapPin size={18} className="text-[#FF6B1A]" />
          <span>Perímetro de Geocerca & Telemetría Espacial</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Define el radio de proximidad física alrededor del edificio Paseo Aranjuez para validar
          la presencia del cliente, activar la telemetría del mapa de calor y permitir la suma de puntos en los tótems de entrada.
        </p>

        <div className="form-grid">
          <label>
            Radio de Geocerca (Metros)
            <input
              type="number"
              min="50"
              max="5000"
              step="10"
              required
              value={values.geofence_radius ?? 200}
              onChange={(e) => setValues({ ...values, geofence_radius: Number(e.target.value) })}
            />
            <small className="text-slate-400 text-[11px] block mt-1">
              Recomendado: 200 metros (cubre accesos América, Pando y parqueos).
            </small>
          </label>

          <label className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-300 mb-2">Validación Estricta</span>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={Boolean(values.geofence_strict)}
                onChange={(e) => setValues({ ...values, geofence_strict: e.target.checked })}
              />
              <span className="text-xs">
                Bloquear escaneo si el cliente está fuera del radio (Desactivado = modo flexible con registro)
              </span>
            </label>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Latitud del Edificio Paseo Aranjuez
            <input
              type="number"
              step="0.000001"
              required
              value={values.geofence_lat ?? -17.37365}
              onChange={(e) => setValues({ ...values, geofence_lat: Number(e.target.value) })}
            />
          </label>
          <label>
            Longitud del Edificio Paseo Aranjuez
            <input
              type="number"
              step="0.000001"
              required
              value={values.geofence_lng ?? -66.15582}
              onChange={(e) => setValues({ ...values, geofence_lng: Number(e.target.value) })}
            />
          </label>
        </div>

        {/* Calibrador GPS en vivo */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={testDeviceGps}
            disabled={testingGps}
            className="button secondary small inline-flex items-center gap-1.5"
          >
            <Compass size={15} />
            {testingGps ? 'Midiendo GPS...' : 'ðŸ“ Calibrar / Probar mi GPS actual'}
          </button>
          {gpsStatus && (
            <span className="text-xs text-slate-200 font-medium bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              {gpsStatus}
            </span>
          )}
        </div>
      </div>

      {/* Sección Puntos por Tótems QR y Recorrido de Pisos */}
      <div className="p-5 rounded-2xl bg-white/5 border border-amber-500/30 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Award size={18} className="text-amber-400" />
          <span>Puntos por Tótems QR de Recorrido (Sin Compra Obligatoria)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Configura cuántos puntos recibe un visitante al escanear los tótems físicos en las puertas principales, en la entrada de cada piso y al salir tras recorrer el centro comercial.
        </p>

        <div className="form-grid">
          <label>
            Puntos por Bienvenida (Puertas América / Dalence)
            <input
              type="number"
              min="0"
              max="500"
              step="1"
              required
              value={values.qr_welcome_points ?? 5}
              onChange={(e) => setValues({ ...values, qr_welcome_points: Number(e.target.value) })}
            />
            <small className="text-slate-400 text-[11px] block mt-1">
              Máximo 1 vez al día por usuario.
            </small>
          </label>

          <label>
            Puntos por Entrada a Piso (PB, P1, P2, P3, S1)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={values.qr_entry_points ?? 1}
              onChange={(e) => setValues({ ...values, qr_entry_points: Number(e.target.value) })}
            />
            <small className="text-slate-400 text-[11px] block mt-1">
              Al llegar al piso por ascensor o gradas (1 vez al día por piso).
            </small>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Puntos por Salida de Piso
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={values.qr_exit_points ?? 2}
              onChange={(e) => setValues({ ...values, qr_exit_points: Number(e.target.value) })}
            />
            <small className="text-slate-400 text-[11px] block mt-1">
              Al culminar el recorrido del nivel (requiere haber iniciado el piso).
            </small>
          </label>

          <label>
            Permanencia Mínima en Piso (Minutos)
            <input
              type="number"
              min="0"
              max="60"
              step="1"
              required
              value={values.qr_min_minutes ?? 2}
              onChange={(e) => setValues({ ...values, qr_min_minutes: Number(e.target.value) })}
            />
            <small className="text-slate-400 text-[11px] block mt-1">
              Tiempo que debe transcurrir entre el escaneo de entrada y salida para evitar abusos.
            </small>
          </label>
        </div>
      </div>

      <p className="notice">
        La equivalencia y la geocerca se aplican inmediatamente. Los tótems de entrada registrarán
        la proximidad del visitante con base en el radio configurado.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? 'Guardando...' : 'Guardar configuración'}
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
          <PaseoCorporateAnalytics data={data} mode="full" />
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
  if (section === 'qrs' || section === 'totems') return <QrStationManager />;
  if (section === 'overview') return <Dashboard />;
  if (section === 'sales' || section === 'payments') return <Orders commerce />;
  return <Reports key={section} section={section} />;
}

