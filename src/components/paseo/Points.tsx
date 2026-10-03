'use client';
import { useRef, useState } from 'react';
import { Gift, Sparkles, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Movement, Redemption, Reward, User } from '@/lib/paseo/model';
import { dateTime, levelFor } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { Empty, ErrorState, Loading, Modal, PageTitle } from './UI';
import { Code } from './Code';
interface PointsData {
  user: User;
  movements: Movement[];
  rewards: Reward[];
  redemptions: Redemption[];
  settings: { points_ratio: number };
}
export function Points() {
  const { data, loading, error, reload } = useResource<PointsData>('puntos', 15000);
  const { refresh } = useSession();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [coupon, setCoupon] = useState<Redemption | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const key = useRef('');
  async function redeem() {
    if (!selected) return;
    setBusy(true);
    setFailure('');
    try {
      const result = await api<{ redemption: Redemption }>('puntos', {
        method: 'POST',
        body: JSON.stringify({ rewardId: selected.id, requestKey: key.current }),
      });
      setSelected(null);
      setCoupon(result.redemption);
      reload();
      void refresh();
      toast.success('Beneficio canjeado');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'No pudimos canjear el beneficio.');
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!data)
    return (
      <div className="container page-space">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  const level = levelFor(data.user.lifetime_points);
  const valid = (c: Redemption) => c.status === 'activo';
  return (
    <div className="container page-space">
      <PageTitle
        eyebrow="Club Paseo"
        title="Cada visita tiene su recompensa"
        description="Compra, acumula y disfruta más del Paseo."
      />
      {error && <ErrorState message={error} retry={reload} />}
      <div className="points-hero">
        <div>
          <span className="tag">
            <Sparkles size={14} /> Nivel {level.name}
          </span>
          <p>Tu saldo disponible</p>
          <div className="points-balance">
            {data.user.points.toLocaleString('es-BO')} <span>puntos</span>
          </div>
          <p>
            Por cada Bs. 1 de compra sumas {data.settings.points_ratio} puntos. Se acredita el total
            entero.
          </p>
          <div className="level-track">
            <span
              style={{
                width: `${level.next ? Math.min(100, ((data.user.lifetime_points - level.min) / (level.next - level.min)) * 100) : 100}%`,
              }}
            />
          </div>
          <small>
            {level.next
              ? `${level.next - data.user.lifetime_points} puntos acumulados para tu próximo nivel`
              : 'Llegaste al nivel más alto del Club'}
            . Canjear no baja tu nivel.
          </small>
        </div>
        <Code type="user" token={data.user.qr_token} label="Muéstralo al comprar" />
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hecho para volver</p>
            <h2>Elige tu próximo beneficio</h2>
          </div>
          <Gift size={28} />
        </div>
        <div className="reward-grid">
          {data.rewards
            .filter((r) => !r.store || r.store.is_active)
            .map((r) => (
              <article className="reward-card" key={r.id}>
                <div className="reward-icon">
                  <Gift size={30} />
                </div>
                <small className="eyebrow">{r.store?.name || 'Club Paseo'}</small>
                <h3>{r.name}</h3>
                <p>{r.description}</p>
                <strong>{r.points_cost.toLocaleString('es-BO')} puntos</strong>
                <small>
                  {r.stock === -1 ? 'Sin límite de unidades' : `${r.stock} disponibles`}
                </small>
                <button
                  className="button secondary full"
                  disabled={r.stock === 0 || data.user.points < r.points_cost}
                  onClick={() => {
                    key.current = crypto.randomUUID();
                    setFailure('');
                    setSelected(r);
                  }}
                >
                  {r.stock === 0
                    ? 'Agotado'
                    : data.user.points < r.points_cost
                      ? `Te faltan ${r.points_cost - data.user.points} puntos`
                      : 'Canjear beneficio'}
                  <ArrowUpRight size={16} />
                </button>
              </article>
            ))}
        </div>
        {!data.rewards.length && (
          <Empty
            title="Pronto habrá más beneficios"
            detail="Administración está preparando el catálogo de recompensas."
          />
        )}
      </section>
      <div className="two-columns">
        <section className="surface">
          <h2>Mis cupones</h2>
          <p className="muted">Presenta cada cupón en el establecimiento indicado.</p>
          {data.redemptions.length ? (
            <ul className="activity-list">
              {data.redemptions.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.reward?.name || 'Beneficio'}</strong>
                    <small>
                      {dateTime(c.created_at)} ·{' '}
                      {valid(c) ? 'Disponible' : c.status === 'usado' ? 'Utilizado' : 'Expirado'}
                    </small>
                  </div>
                  {valid(c) && (
                    <button className="text-button" onClick={() => setCoupon(c)}>
                      Ver cupón
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Tus beneficios canjeados aparecerán aquí.</p>
          )}
        </section>
        <section className="surface">
          <h2>Mis movimientos</h2>
          <p className="muted">Últimos 200 movimientos de tu cuenta.</p>
          <ul className="activity-list">
            {data.movements.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.reason}</strong>
                  <small>{dateTime(m.created_at)}</small>
                </div>
                <span className={m.amount > 0 ? 'positive' : 'muted'}>
                  {m.amount > 0 ? '+' : ''}
                  {m.amount}
                </span>
              </li>
            ))}
          </ul>
          {!data.movements.length && <p>Aún no hay movimientos.</p>}
        </section>
      </div>
      {selected && (
        <Modal
          title="Confirmar canje"
          onClose={() => {
            if (!busy) setSelected(null);
          }}
        >
          <p>
            Usarás <strong>{selected.points_cost} puntos</strong> para obtener {selected.name}. El
            cupón vence en 30 días y se utiliza una sola vez.
          </p>
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          <div className="form-actions">
            <button className="button secondary" disabled={busy} onClick={() => setSelected(null)}>
              Volver
            </button>
            <button className="button" disabled={busy} onClick={redeem}>
              {busy ? 'Canjeando…' : 'Confirmar canje'}
            </button>
          </div>
        </Modal>
      )}
      {coupon && (
        <Modal title={coupon.reward?.name || 'Tu beneficio'} onClose={() => setCoupon(null)}>
          <Code
            type="coupon"
            token={coupon.qr_token}
            manual={coupon.coupon_code}
            label="Cupón de un solo uso"
          />
          <p className="muted">
            {coupon.expires_at ? `Vence: ${dateTime(coupon.expires_at)}.` : ''} Muéstralo al
            comercio para recibir tu beneficio.
          </p>
        </Modal>
      )}
    </div>
  );
}
