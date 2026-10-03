'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Gift, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, useSession } from './Providers';
import { getPublicDB } from '@/lib/paseo/supabase';
import type { User } from '@/lib/paseo/model';
import { homeFor, levelFor } from '@/lib/paseo/model';
import { ErrorState, Loading, PageTitle } from './UI';
import { Code } from './Code';

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { setUser } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleLogin() {
    setBusy(true);
    setError('');
    try {
      const supabase = getPublicDB();
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://aranjuez.vercel.app/auth/callback';

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (oauthError) throw new Error(oauthError.message);
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con el servicio de Google.');
      toast.error(err?.message || 'No se pudo iniciar con Google.');
      setBusy(false);
    }
  }

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
      toast.success(
        register
          ? `¡Bienvenido al Club, ${user.name}! +50 puntos asignados.`
          : `¡Hola de nuevo, ${user.name}!`
      );
      router.push(homeFor(user.role));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos iniciar sesión.';
      setError(msg);
      toast.error(msg);
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
          <span>Compra online y retira en tu tienda con PaseoYa.</span>
        </div>
        <div className="auth-benefit">
          <Gift size={20} />
          <span>Suma puntos y canjea experiencias exclusivas.</span>
        </div>
        <div className="auth-benefit">
          <ShieldCheck size={20} />
          <span>Historial de pedidos y compras siempre a mano.</span>
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

        {/* Botón Oficial Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy}
          className="google-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            border: '1px solid rgba(255,255,255,0.2)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: busy ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            marginBottom: '16px',
            marginTop: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>{register ? 'Registrarse con Google' : 'Continuar con Google'}</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '18px 0',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span>O con correo electrónico</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

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
