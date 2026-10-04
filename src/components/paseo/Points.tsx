'use client';
import { useRef, useState, useId, useEffect } from 'react';
import { Gift, Sparkles, ArrowUpRight, Camera, QrCode, MapPin, Compass } from 'lucide-react';
import { toast } from 'sonner';
import type { Movement, Redemption, Reward, User } from '@/lib/paseo/model';
import { dateTime, levelFor } from '@/lib/paseo/model';
import { api, useResource, useSession } from './Providers';
import { Empty, ErrorState, Loading, Modal, PageTitle } from './UI';
import { Code } from './Code';
import { findStation, PENDING_QR_KEY } from '@/lib/paseo/stations';
interface PointsData {
  user: User;
  movements: Movement[];
  rewards: Reward[];
  redemptions: Redemption[];
  settings: { points_ratio: number };
}

function TotemCameraReader({
  onCode,
  onClose,
}: {
  onCode: (value: string, coords?: { lat: number; lng: number } | null) => void;
  onClose: () => void;
}) {
  const id = 'camera-totem-' + useId().replace(/:/g, '');
  const [error, setError] = useState('');
  const coords = useRef<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(true);

  const receive = useRef(onCode);
  useEffect(() => {
    receive.current = onCode;
  }, [onCode]);

  // Obtener geolocalización para telemetría y geocerca
  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setLocating(false));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        coords.current = { lat: latitude, lng: longitude };

        // Distancia a Paseo Aranjuez (-17.3739, -66.1558)
        const R = 6371e3;
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (-17.3739 * Math.PI) / 180;
        const Δφ = ((-17.3739 - latitude) * Math.PI) / 180;
        const Δλ = ((-66.1558 - longitude) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = Math.round(R * c);

        setDistance(dist);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 7000, enableHighAccuracy: true },
    );
  }, []);

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
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (value) => {
            if (!delivered && !stopped) {
              delivered = true;
              const st = findStation(value);
              receive.current(st ? st.code : value, coords.current);
            }
          },
          () => {},
        );
      })
      .catch(() => {
        if (!stopped) setError('No pudimos abrir la cámara. Autoriza el acceso en tu navegador.');
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
    <Modal title="Escanear Tótem de Entrada" onClose={onClose}>
      <div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
        {locating ? (
          <span className="text-slate-400 flex items-center gap-1.5">
            <Compass size={14} className="animate-spin text-[#FF6B1A]" />
            Detectando perímetro de Paseo Aranjuez...
          </span>
        ) : distance !== null ? (
          <div className="flex items-center justify-between">
            <span
              className={
                distance <= 200 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'
              }
            >
              {distance <= 200 ? '🟢 Perímetro Aranjuez verificado' : '📍 Proximidad detectada'}
            </span>
            <span className="text-slate-300 font-mono">~{distance} metros</span>
          </div>
        ) : (
          <span className="text-slate-400">📍 Perímetro de proximidad (Radio: 200m)</span>
        )}
      </div>

      <div className="camera-reader" id={id} />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">
        Apunta la cámara al código QR impreso en el tótem o mostrador del Paseo.
      </p>
    </Modal>
  );
}
export function Points() {
  const { data, loading, error, reload } = useResource<PointsData>('puntos', 15000);
  const { refresh } = useSession();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [coupon, setCoupon] = useState<Redemption | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  const [camera, setCamera] = useState(false);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [manualCode, setManualCode] = useState('');
  // Reclamar QR pendiente si venía de un escaneo con cámara antes de loguearse
  useEffect(() => {
    try {
      const pending = localStorage.getItem(PENDING_QR_KEY);
      if (pending) {
        localStorage.removeItem(PENDING_QR_KEY);
        handleEntranceCheckIn(pending);
      }
    } catch {}
  }, []);
  async function handleEntranceCheckIn(
    customCode?: string,
    userCoords?: { lat: number; lng: number } | null,
  ) {
    setCheckinBusy(true);
    try {
      if (!userCoords && navigator.geolocation)
        userCoords = await new Promise((resolve) =>
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { timeout: 7000, enableHighAccuracy: true },
          ),
        );
      const res = await api<{
        ok: boolean;
        message: string;
        pointsAwarded?: number;
        distanceToPaseo?: number;
      }>('checkin', {
        method: 'POST',
        body: JSON.stringify({
          code: customCode || 'PASEO-TOTEM-LOBBY',
          userLat: userCoords?.lat,
          userLng: userCoords?.lng,
        }),
      });
      toast.success(res.message || '¡Ingreso registrado! Puntos sumados');
      setCamera(false);
      reload();
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos registrar tu ingreso.');
    } finally {
      setCheckinBusy(false);
    }
  }

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
  const level = levelFor(data.user.points);
  const valid = (c: Redemption) => c.status === 'activo';
  return (
    <div className="container page-space">
      <PageTitle
        eyebrow="Club Paseo"
        title="Cada visita tiene su recompensa"
        description="Compra, acumula y disfruta más del Paseo."
      />
      {error && <ErrorState message={error} retry={reload} />}

      {/* Banner de Mapeo Peatonal y Puntos por Recorrido */}
      <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-[#061734] via-[#0b2554] to-[#061734] border border-[#FF6B1A]/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#FF6B1A]/20 text-[#FF6B1A]">
              <QrCode size={18} />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              ¡Gana puntos al recorrer cada nivel del Paseo!
            </h3>
          </div>
          <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
            Escanea los códigos QR ubicados al inicio (+1 pt) y salida (+2 pts) de cada nivel, o en
            los accesos principales (+5 pts). No necesitas comprar para sumar puntos y ayudarnos a
            mapear el tráfico del edificio.
          </p>
        </div>
        <button
          onClick={() => setCamera(true)}
          className="button flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all shrink-0"
        >
          <Camera size={16} /> Abrir Cámara para Escanear
        </button>
      </div>

      <form
        className="surface"
        onSubmit={(e) => {
          e.preventDefault();
          void handleEntranceCheckIn(manualCode);
        }}
      >
        <label>
          Código del tótem
          <input
            required
            value={manualCode}
            maxLength={200}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="PASEO-P1-ENTRADA"
          />
        </label>
        <button className="button secondary" disabled={checkinBusy}>
          {checkinBusy ? 'Registrando…' : 'Registrar código manual'}
        </button>
        <p className="muted">
          Máximo 100 puntos diarios por visitas. Autoriza tu ubicación cuando se solicite.
        </p>
      </form>
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
                width: `${level.next ? Math.min(100, ((data.user.points - level.min) / (level.next - level.min)) * 100) : 100}%`,
              }}
            />
          </div>
          <small>
            {level.next
              ? `${level.next - data.user.points} puntos acumulados para tu próximo nivel`
              : 'Llegaste al nivel más alto del Club'}
            . El nivel refleja tu saldo disponible.
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
