'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Camera, CheckCircle2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, Store } from '@/lib/paseo/model';
import { money, STATUS_LABEL } from '@/lib/paseo/model';
import { api, useResource } from './Providers';
import { ErrorState, Loading, Modal, PageTitle } from './UI';

function CameraReader({
  onCode,
  onClose,
}: {
  onCode: (value: string) => void;
  onClose: () => void;
}) {
  const id = 'camera-' + useId().replace(/:/g, '');
  const [error, setError] = useState('');
  const receive = useRef(onCode);
  useEffect(() => {
    receive.current = onCode;
  }, [onCode]);
  useEffect(() => {
    let stopped = false;
    let reader: import('html5-qrcode').Html5Qrcode | undefined;
    let delivered = false;
    const startup = import('html5-qrcode')
      .then(async ({ Html5Qrcode }) => {
        if (stopped) return;
        reader = new Html5Qrcode(id);
        await reader.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 200, height: 200 } },
          (value) => {
            if (!delivered && !stopped) {
              delivered = true;
              receive.current(value);
            }
          },
          () => {},
        );
      })
      .catch(() => {
        if (!stopped)
          setError(
            'No pudimos abrir la cámara. Autoriza el acceso o ingresa el código manualmente.',
          );
      });
    return () => {
      stopped = true;
      void startup
        .finally(async () => {
          if (reader?.isScanning) await reader.stop();
          reader?.clear();
        })
        .catch(() => {});
    };
  }, [id]);
  return (
    <Modal title="Escanear código QR" onClose={onClose}>
      <div className="camera-reader" id={id} />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">Apunta al QR del cliente. También puedes cerrar e ingresar el código.</p>
    </Modal>
  );
}
export function Terminal() {
  const { data, loading, error, reload } = useResource<{ rows: Store[] }>('gestion/tiendas');
  const [type, setType] = useState('user');
  const [code, setCode] = useState('');
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [success, setSuccess] = useState('');
  const [customer, setCustomer] = useState<{ id: string; name: string; points: number } | null>(
    null,
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  async function lookup() {
    setBusy(true);
    setFailure('');
    setSuccess('');
    setCustomer(null);
    setOrder(null);
    try {
      const result = await api<{ customer?: typeof customer; order?: Order; message?: string }>(
        'scanner',
        { method: 'POST', body: JSON.stringify({ type, code }) },
      );
      if (result.customer) setCustomer(result.customer);
      if (result.order) setOrder(result.order);
      if (result.message) {
        setSuccess(result.message);
        setCode('');
      }
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos validar el código.');
    } finally {
      setBusy(false);
    }
  }
  async function purchase() {
    if (!customer) return;
    setBusy(true);
    setFailure('');
    try {
      await api('compras', {
        method: 'POST',
        body: JSON.stringify({
          storeId: store || data?.rows.find((s) => s.is_active)?.id,
          customerId: customer.id,
          amount: Number(amount),
          reference,
        }),
      });
      setCustomer(null);
      setAmount('');
      setReference('');
      setCode('');
      setSuccess('Compra registrada. Los puntos ya están en la cuenta del cliente.');
      toast.success('Puntos acreditados');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos registrar la compra.');
    } finally {
      setBusy(false);
    }
  }
  async function deliver() {
    if (!order) return;
    setBusy(true);
    setFailure('');
    try {
      await api('pedidos', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: order.id, status: 'entregado', code }),
      });
      setOrder(null);
      setCode('');
      setSuccess('Retiro y cobro confirmados. Puntos acreditados.');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos confirmar el retiro.');
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!data) return <ErrorState message={error} retry={reload} />;
  return (
    <>
      <PageTitle
        eyebrow="Paseo Points + PaseoYa"
        title="Caja y validación"
        description="Registra compras presenciales, entrega pedidos y valida beneficios."
      />
      <div className="terminal-layout">
        <section className="surface">
          <div className="terminal-icon">
            <QrCode size={38} />
          </div>
          <h2>¿Qué vas a validar?</h2>
          <div className="tabs">
            {[
              ['user', 'Compra presencial'],
              ['order', 'Retiro de pedido'],
              ['coupon', 'Cupón de beneficio'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={type === value ? 'active' : ''}
                disabled={busy}
                onClick={() => {
                  setType(value);
                  setCode('');
                  setFailure('');
                  setSuccess('');
                  setCustomer(null);
                  setOrder(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup();
            }}
          >
            <label>
              {type === 'user'
                ? 'Código personal del cliente'
                : type === 'order'
                  ? 'Código de retiro'
                  : 'Código del cupón'}
              <input
                required
                minLength={3}
                maxLength={500}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCustomer(null);
                  setOrder(null);
                }}
                placeholder="Escanea o pega el código"
              />
            </label>
            <button
              type="button"
              className="button secondary full"
              onClick={() => setCamera(true)}
              disabled={busy}
            >
              <Camera size={18} /> Abrir cámara
            </button>
            {type === 'coupon' && (
              <p className="notice">
                Validar consume el cupón. Hazlo cuando el cliente vaya a recibir el beneficio.
              </p>
            )}
            <button className="button full" disabled={busy || !code.trim()}>
              {busy
                ? 'Validando…'
                : type === 'coupon'
                  ? 'Validar y consumir cupón'
                  : 'Consultar código'}
            </button>
          </form>
        </section>
        <section className="surface">
          <h2>Detalle de la operación</h2>
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          {success && (
            <div className="notice success" role="status">
              <CheckCircle2 size={24} />
              <p>{success}</p>
            </div>
          )}
          {customer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void purchase();
              }}
            >
              <h3>{customer.name}</h3>
              <p className="muted">Saldo actual: {customer.points} puntos.</p>
              <label>
                Establecimiento
                <select
                  required
                  value={store || data.rows.find((s) => s.is_active)?.id || ''}
                  onChange={(e) => setStore(e.target.value)}
                >
                  {data.rows
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Monto cobrado (Bs.)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                Número de ticket o referencia única
                <input
                  minLength={3}
                  maxLength={100}
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej. TICKET-2026-001"
                />
              </label>
              <p className="muted">
                Usa la misma referencia al reintentar una compra. Cada ticket acredita puntos una
                sola vez.
              </p>
              <button
                className="button full"
                disabled={busy || !data.rows.some((s) => s.is_active)}
              >
                {busy ? 'Registrando…' : 'Registrar compra y acreditar puntos'}
              </button>
            </form>
          )}
          {order && (
            <div>
              <h3>Pedido {order.id.slice(0, 8).toUpperCase()}</h3>
              <p>
                {order.user?.name} · {order.store?.name}
              </p>
              <span className={`status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
              <ul className="item-list">
                {order.items.map((i) => (
                  <li key={i.id}>
                    <span>
                      {i.quantity} × {i.product_name}
                    </span>
                    <strong>{money(i.subtotal)}</strong>
                  </li>
                ))}
              </ul>
              <h3>Total a cobrar: {money(order.total)}</h3>
              <p>
                Antes de entregar, comprueba el cobro presencial. Esta confirmación acredita{' '}
                {order.points_earned} puntos.
              </p>
              <button
                className="button full"
                disabled={busy || !['listo', 'llego'].includes(order.status)}
                onClick={deliver}
              >
                {busy ? 'Confirmando…' : 'Confirmar cobro y entrega'}
              </button>
              {!['listo', 'llego'].includes(order.status) && (
                <p className="muted">El pedido debe estar listo para retirar.</p>
              )}
            </div>
          )}
          {!customer && !order && !success && (
            <p className="muted">
              Consulta un código para comenzar. Las operaciones se guardan en el historial del
              Paseo.
            </p>
          )}
        </section>
      </div>
      {camera && (
        <CameraReader
          onClose={() => setCamera(false)}
          onCode={(value) => {
            setCode(value);
            setCustomer(null);
            setOrder(null);
            setCamera(false);
          }}
        />
      )}
    </>
  );
}
