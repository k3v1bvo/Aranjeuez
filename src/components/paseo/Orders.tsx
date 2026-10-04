'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { PackageCheck, RefreshCw, MapPin, Clock3 } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/paseo/model';
import { dateTime, money, ORDER_STEPS, STATUS_LABEL } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { Empty, ErrorState, Loading, Modal, PageTitle } from './UI';
import { Code } from './Code';

export function Orders({ commerce = false }: { commerce?: boolean }) {
  const { data, loading, error, reload } = useResource<{ orders: Order[] }>('pedidos', 15000);
  const { refresh } = useSession();
  const [filter, setFilter] = useState('todos');
  const [pending, setPending] = useState<{ order: Order; status: OrderStatus } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  function ask(order: Order, status: OrderStatus) {
    setPending({ order, status });
    setCode('');
    setFailure('');
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setFailure('');
    try {
      await api('pedidos', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: pending.order.id, status: pending.status, code }),
      });
      setPending(null);
      reload();
      void refresh();
      toast.success('Pedido actualizado');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos actualizar el pedido.');
    } finally {
      setBusy(false);
    }
  }
  const orders =
    data?.orders.filter(
      (o) =>
        filter === 'todos' ||
        (filter === 'activos'
          ? !['entregado', 'cancelado'].includes(o.status)
          : o.status === filter),
    ) || [];
  return (
    <section className={commerce ? 'orders-section' : 'container page-space'}>
      <PageTitle
        eyebrow={commerce ? 'Operación del establecimiento' : 'PaseoYa · Retiro presencial'}
        title={commerce ? 'Pedidos de tu local' : 'Mis pedidos'}
        description="El estado se actualiza cada 15 segundos. Paga al retirar en el establecimiento."
      >
        <button className="button secondary small" onClick={reload}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </PageTitle>
      <div className="toolbar">
        <label>
          Mostrar
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="todos">Todos los pedidos</option>
            <option value="activos">En curso</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <small className="muted">Hasta 200 pedidos recientes</small>
      </div>
      {error && <ErrorState message={error} retry={reload} />}
      {loading ? (
        <Loading />
      ) : !orders.length ? (
        <Empty
          title="Sin pedidos en esta vista"
          detail={
            commerce
              ? 'Aquí aparecerán las compras realizadas en tus establecimientos.'
              : 'Encuentra algo que te guste y prepara tu próxima visita.'
          }
          href={commerce ? undefined : '/cliente'}
        />
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <article className="order-card" key={o.id}>
              <div className="order-head">
                <div>
                  <small className="muted">
                    Pedido {o.id.slice(0, 8).toUpperCase()} · {dateTime(o.created_at)}
                  </small>
                  <h2>{o.store?.name || 'Establecimiento'}</h2>
                  {commerce && <p>{o.user?.name || 'Cliente'}</p>}
                </div>
                <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              {o.status !== 'cancelado' && (
                <ol className="order-timeline" aria-label="Progreso del pedido">
                  {ORDER_STEPS.map((step, i) => (
                    <li
                      key={step}
                      className={i <= ORDER_STEPS.indexOf(o.status) ? 'done' : ''}
                      aria-current={o.status === step ? 'step' : undefined}
                    >
                      <span>{i + 1}</span>
                      {STATUS_LABEL[step]}
                    </li>
                  ))}
                </ol>
              )}
              <div className="order-body">
                <div>
                  <ul className="item-list">
                    {o.items.map((i) => (
                      <li key={i.id}>
                        <span>
                          {i.quantity} × {i.product_name || 'Producto'}
                        </span>
                        <strong>{money(i.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="order-total">
                    <span>
                      Total ·{' '}
                      {o.payment_status === 'pagado'
                        ? 'Pagado'
                        : o.status === 'cancelado'
                          ? 'Cancelado'
                          : 'Pago al retirar'}
                    </span>
                    <strong>{money(o.total)}</strong>
                  </div>
                  <p className="muted">
                    <MapPin size={15} />{' '}
                    {[o.store?.floor, o.store?.sector, o.store?.local_num]
                      .filter(Boolean)
                      .join(' · ') || 'Consulta la ubicación con el establecimiento.'}
                  </p>
                  <p className="muted">
                    <Clock3 size={15} />{' '}
                    {o.pickup_schedule ||
                      o.store?.schedule ||
                      'Horario por confirmar con el establecimiento'}
                  </p>
                  <p className="points-note">
                    {o.status === 'entregado' ? 'Acreditados' : 'Al retirar sumarás'}:{' '}
                    <strong>{o.points_earned} puntos</strong>
                  </p>
                </div>
                {!commerce && !['cancelado', 'entregado'].includes(o.status) && (
                  <Code
                    type="order"
                    token={o.qr_token}
                    manual={o.pickup_code}
                    label="Tu código de retiro"
                  />
                )}
              </div>
              <div className="order-actions">
                {commerce && ['pendiente', 'en_preparacion'].includes(o.status) && (
                  <button
                    className="button"
                    onClick={() =>
                      ask(o, o.status === 'pendiente' ? 'en_preparacion' : 'listo_para_recoger')
                    }
                  >
                    {o.status === 'pendiente'
                      ? 'Comenzar preparación'
                      : 'Marcar listo para recoger'}
                  </button>
                )}
                {commerce && ['listo_para_recoger'].includes(o.status) && (
                  <button className="button" onClick={() => ask(o, 'entregado')}>
                    <PackageCheck size={17} /> Validar entrega y cobro
                  </button>
                )}
                {((!commerce && o.status === 'pendiente') ||
                  (commerce && !['entregado', 'cancelado'].includes(o.status))) && (
                  <button className="text-button danger" onClick={() => ask(o, 'cancelado')}>
                    Cancelar pedido
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {pending && (
        <Modal
          title={
            pending.status === 'entregado'
              ? 'Confirmar retiro y pago'
              : pending.status === 'cancelado'
                ? 'Cancelar este pedido'
                : STATUS_LABEL[pending.status]
          }
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <p>
            {pending.status === 'cancelado'
              ? 'Se devolverán los productos al stock. Esta acción no se puede deshacer.'
              : pending.status === 'entregado'
                ? `Comprueba el cobro presencial de ${money(pending.order.total)} y solicita el código al cliente. Al confirmar se acreditarán sus puntos.`
                : 'Confirma el cambio de estado. El cliente y el establecimiento verán la actualización.'}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void confirm();
            }}
          >
            {pending.status === 'entregado' && (
              <label>
                Código de retiro
                <input
                  autoFocus
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código del cliente o contenido del QR"
                />
              </label>
            )}
            {failure && (
              <p role="alert" className="form-error">
                {failure}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setPending(null)}
              >
                Volver
              </button>
              <button className="button" disabled={busy}>
                {busy ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
