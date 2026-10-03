'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Gift, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { api, useSession } from './Providers';
import type { User } from '@/lib/paseo/model';
import { homeFor, levelFor } from '@/lib/paseo/model';
import { ErrorState, Loading, PageTitle } from './UI';
import { Code } from './Code';

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { setUser } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { user } = await api<{ user: User }>('auth', {
        method: 'POST',
        body: JSON.stringify({
          action: register ? 'register' : 'login',
          ...Object.fromEntries(form),
        }),
      });
      setUser(user);
      router.push(homeFor(user.role));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-layout">
      <section className="auth-story">
        <span className="module-icon lavender">
          <Sparkles size={28} />
        </span>
        <p className="eyebrow">Tu Paseo, más cerca</p>
        <h1>
          {register ? 'Hay mucho por descubrir. Y por ganar.' : 'Qué bueno tenerte de vuelta.'}
        </h1>
        <p>Una cuenta para tus compras, tus puntos y todos esos planes que empiezan en el Paseo.</p>
        <div className="auth-benefit">
          <ShoppingIcon />
          <span>Compra online y retira en tu tienda.</span>
        </div>
        <div className="auth-benefit">
          <Gift size={20} />
          <span>Suma puntos y disfruta beneficios.</span>
        </div>
        <div className="auth-benefit">
          <ShieldCheck size={20} />
          <span>Tu historial, siempre a mano.</span>
        </div>
      </section>
      <section className="form-card">
        <p className="eyebrow">{register ? 'Súmate al Club' : 'Mi cuenta'}</p>
        <h2>{register ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
        <p className="muted">
          {register
            ? 'Completa tus datos y empieza a explorar.'
            : 'Clientes, comercios y administración ingresan aquí.'}
        </p>
        <form onSubmit={submit} className="form-stack">
          {register && (
            <label>
              Nombre completo
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Tu nombre"
              />
            </label>
          )}
          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="tucorreo@ejemplo.com"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={72}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          {register && (
            <>
              <label>
                Celular <span className="muted">(opcional)</span>
                <input name="phone" autoComplete="tel" type="tel" maxLength={25} />
              </label>
              <label>
                Fecha de nacimiento <span className="muted">(opcional)</span>
                <input name="birthday" type="date" autoComplete="bday" />
              </label>
            </>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? 'Un momento…' : register ? 'Crear mi cuenta' : 'Ingresar'}{' '}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'}{' '}
          <Link href={register ? '/auth/login' : '/auth/registro'}>
            {register ? 'Inicia sesión' : 'Regístrate'}
          </Link>
        </p>
      </section>
    </div>
  );
}
function ShoppingIcon() {
  return <UserRound size={20} />;
}
export function Profile() {
  const { user, loading, error, refresh } = useSession();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!user)
    return (
      <div className="container">
        <PageTitle title="Tu cuenta del Paseo" />
        <Link className="button" href="/auth/login">
          Iniciar sesión
        </Link>
      </div>
    );
  const level = levelFor(user.lifetime_points);
  return (
    <div className="container narrow">
      <PageTitle
        eyebrow="Club Paseo Aranjuez"
        title="Tu tarjeta del Paseo"
        description="Preséntala al comprar en un establecimiento participante para sumar puntos."
      />
      <section className="membership-card">
        <div className="membership-head">
          <span>PASEO · ARANJUEZ</span>
          <span className="tag">{level.name}</span>
        </div>
        <h2>{user.name}</h2>
        <p>
          <Mail size={15} /> {user.email}
        </p>
        <Code type="user" token={user.qr_token} label="QR de membresía" />
        <div className="membership-bottom">
          <div>
            <strong>{user.points.toLocaleString('es-BO')}</strong>
            <small>Puntos disponibles</small>
          </div>
          <div>
            <strong>{user.lifetime_points.toLocaleString('es-BO')}</strong>
            <small>Puntos acumulados</small>
          </div>
        </div>
      </section>
      <div className="quick-grid">
        <Link className="card" href="/cliente/puntos">
          <Gift />
          <h3>Mis beneficios</h3>
          <p>Descubre qué puedes canjear.</p>
        </Link>
        <Link className="card" href="/cliente/pedidos">
          <ShieldCheck />
          <h3>Mis pedidos</h3>
          <p>Consulta tus próximos retiros.</p>
        </Link>
      </div>
    </div>
  );
}
