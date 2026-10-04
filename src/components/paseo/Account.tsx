'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowUpRight,
  Gift,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Building2,
  Phone,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, useSession } from './Providers';
import { getPublicDB } from '@/lib/paseo/supabase';
import type { User } from '@/lib/paseo/model';
import { homeFor, levelFor } from '@/lib/paseo/model';
import { ErrorState, Loading, PageTitle } from './UI';
import { Code } from './Code';

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { user, setUser, logout } = useSession();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(
    register ? 'register' : 'login',
  );
  const [accountType] = useState<'cliente' | 'comercio'>('cliente');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : undefined) ||
          'Error al conectar con el servicio de Google.',
      );
      toast.error(
        (err instanceof Error ? err.message : undefined) || 'No se pudo iniciar con Google.',
      );
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'forgot') {
        const email = String(form.get('email') || '')
          .trim()
          .toLowerCase();
        const res = await api<{ ok: boolean; message: string }>('auth', {
          method: 'POST',
          body: JSON.stringify({ action: 'forgot_password', email }),
        });
        setSuccessMsg(
          res.message || 'Si el correo está registrado, recibirás un enlace de recuperación.',
        );
        toast.success('Correo enviado: Revisa tu bandeja de entrada o spam.');
        return;
      }

      const formObj = Object.fromEntries(form);
      const { user } = await api<{ user: User }>('auth', {
        method: 'POST',
        body: JSON.stringify({
          action: mode === 'register' ? 'register' : 'login',
          accountType,
          ...formObj,
        }),
      });

      setUser(user);
      toast.success(
        mode === 'register'
          ? `¡Bienvenido a Paseo Aranjuez, ${user.name}!`
          : `¡Hola de nuevo, ${user.name}!`,
      );
      router.push(homeFor(user.role));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos procesar la solicitud.';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="container auth-layout" style={{ maxWidth: '520px', margin: '40px auto' }}>
        <div
          className="form-card"
          style={{
            padding: '36px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #B84D0B, #FF6B1A)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '24px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(255, 107, 26, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span
            className="tag"
            style={{
              textTransform: 'uppercase',
              marginBottom: '8px',
              background: 'rgba(212, 162, 76, 0.2)',
              color: '#D4A24C',
              border: '1px solid rgba(212, 162, 76, 0.4)',
            }}
          >
            Sesión Activa
          </span>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#fff',
              marginTop: '8px',
              marginBottom: '4px',
            }}
          >
            {user.name}
          </h2>
          <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
            {user.email}
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              padding: '6px 16px',
              borderRadius: '12px',
              marginBottom: '28px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4A24C' }}>
              Rol: {user.role.toUpperCase()}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B1A' }}>
              {(user.points || 0).toLocaleString()} Puntos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href={homeFor(user.role)}
              className="button primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {user.role === 'admin'
                ? 'Ir al Panel de Administración'
                : user.role === 'comercio'
                  ? 'Ir al Panel de Mi Tienda & Caja'
                  : 'Ir al Catálogo & PaseoYa'}
            </Link>

            <Link
              href="/cliente/perfil"
              className="button light"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Ver Mi Perfil & Credencial QR
            </Link>

            <button
              onClick={() => logout().catch((e) => toast.error(e.message))}
              className="button"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                cursor: 'pointer',
              }}
            >
              Cerrar Sesión (Ingresar con otra cuenta)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-layout">
      <section className="auth-story">
        <span className="module-icon lavender">
          <Sparkles size={28} />
        </span>
        <p className="eyebrow">Tu Paseo, más cerca</p>
        <h1>
          {mode === 'register'
            ? 'Hay mucho por descubrir. Y por ganar.'
            : mode === 'forgot'
              ? 'Recupera tu acceso al instante.'
              : 'Qué bueno tenerte de vuelta.'}
        </h1>
        <p>Una cuenta para tus compras, tus puntos y todos esos planes que empiezan en el Paseo.</p>
        <div className="auth-benefit">
          <ShoppingIcon />
          <span>Compra online y retira en tu tienda con PaseoYa Click & Collect.</span>
        </div>
        <div className="auth-benefit">
          <Gift size={20} />
          <span>Suma Paseo Points en cada visita y canjea beneficios.</span>
        </div>
        <div className="auth-benefit">
          <ShieldCheck size={20} />
          <span>Acceso seguro y asistencia con Jarvis Concierge IA.</span>
        </div>
      </section>

      <section className="form-card">
        <p className="eyebrow">
          {mode === 'register' ? 'Súmate al Club' : mode === 'forgot' ? 'Seguridad' : 'Mi cuenta'}
        </p>
        <h2>
          {mode === 'register'
            ? 'Crea tu cuenta'
            : mode === 'forgot'
              ? 'Recuperar contraseña'
              : 'Inicia sesión'}
        </h2>
        <p className="muted">
          {mode === 'register'
            ? 'Completa tus datos para unirte al Club Paseo. Las cuentas de comercio las asigna administración.'
            : mode === 'forgot'
              ? 'Te enviaremos una contraseña temporal a tu correo electrónico vía Google SMTP.'
              : 'Clientes, comercios y administración ingresan aquí.'}
        </p>

        {/* Selector de Tipo de Cuenta si es Registro */}
        {mode !== 'forgot' && (
          <>
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
              <span>{mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}</span>
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
          </>
        )}

        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && (
            <label>
              Nombre completo {accountType === 'comercio' ? 'del Titular' : ''}
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Tu nombre completo"
              />
            </label>
          )}

          {mode === 'register' && accountType === 'comercio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label>
                Nombre del Negocio
                <input name="storeName" required maxLength={100} placeholder="Ej: Samsung Store" />
              </label>
              <label>
                Categoría
                <select name="storeCategory" defaultValue="Tecnología">
                  <option value="Tecnología">Tecnología</option>
                  <option value="Moda">Moda</option>
                  <option value="Gastronomía">Gastronomía</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Belleza">Belleza</option>
                  <option value="Servicios">Servicios</option>
                </select>
              </label>
              <label>
                Piso / Nivel
                <select name="storeFloor" defaultValue="Piso 1">
                  <option value="Planta Baja">Planta Baja</option>
                  <option value="Piso 1">Piso 1</option>
                  <option value="Piso 2">Piso 2</option>
                  <option value="Piso 3">Patio Gastronómico (P3)</option>
                  <option value="Piso 4">Terraza El Cuarto (P4)</option>
                </select>
              </label>
              <label>
                Local / Bahía
                <input name="storeLocal" required maxLength={50} placeholder="Ej: Local 104" />
              </label>
            </div>
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

          {mode !== 'forgot' && (
            <div>
              <label>
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  maxLength={72}
                  placeholder="Mínimo 8 caracteres"
                />
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF6B1A',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'block',
                    textAlign: 'right',
                    width: '100%',
                    marginTop: '4px',
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}

          {mode === 'register' && (
            <>
              <label>
                Celular <span className="muted">(opcional)</span>
                <input
                  name="phone"
                  autoComplete="tel"
                  type="tel"
                  maxLength={25}
                  placeholder="+591 70000000"
                />
              </label>
              {accountType === 'cliente' && (
                <label>
                  Fecha de nacimiento <span className="muted">(opcional)</span>
                  <input name="birthday" type="date" autoComplete="bday" />
                </label>
              )}
            </>
          )}

          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                color: '#10B981',
                margin: '8px 0',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          <button className="button full" disabled={busy}>
            {busy
              ? 'Un momento…'
              : mode === 'register'
                ? `Crear cuenta ${accountType === 'comercio' ? 'de comercio' : 'de cliente'}`
                : mode === 'forgot'
                  ? 'Enviar contraseña temporal por correo'
                  : 'Ingresar'}{' '}
            <ArrowUpRight size={17} />
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                width: '100%',
                marginTop: '10px',
              }}
            >
              ← Volver a iniciar sesión
            </button>
          )}
        </form>

        <p className="auth-switch">
          {mode === 'register' ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF6B1A',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {mode === 'register' ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </section>
    </div>
  );
}

function ShoppingIcon() {
  return <UserRound size={20} />;
}

export function Profile() {
  const { user, loading, error, refresh, setUser } = useSession();
  const [busyInfo, setBusyInfo] = useState(false);
  const [busyPass, setBusyPass] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Initialize fields once user is loaded
  useState(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBirthday(user.birthday || '');
    }
  });

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

  const level = levelFor(user.points);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusyInfo(true);
    try {
      const res = await api<{ user: User }>('auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_profile',
          name,
          phone: phone || null,
          birthday: birthday || null,
        }),
      });
      if (res.user) {
        setUser(res.user);
        toast.success('¡Datos personales actualizados correctamente!');
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : undefined) || 'Error al actualizar datos.');
    } finally {
      setBusyInfo(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden.');
      return;
    }
    setBusyPass(true);
    try {
      await api<{ ok: boolean; message: string }>('auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });
      toast.success('¡Contraseña cambiada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : undefined) || 'Error al cambiar contraseña.',
      );
    } finally {
      setBusyPass(false);
    }
  }

  return (
    <div className="container narrow" style={{ paddingBottom: '60px' }}>
      <PageTitle
        eyebrow="Club Paseo Aranjuez"
        title="Mi Perfil & Credencial"
        description="Gestiona tus datos personales, contraseña, accesos de rol y credencial QR de retiro."
      />

      {/* Tarjeta de Membresía Digital */}
      <section className="membership-card" style={{ marginBottom: '24px' }}>
        <div className="membership-head">
          <span>PASEO · ARANJUEZ</span>
          <span className="tag">{level.name}</span>
        </div>
        <h2>{user.name}</h2>
        <p>
          <Mail size={15} /> {user.email}{' '}
          {user.role !== 'cliente' && (
            <strong style={{ color: '#D4A24C', marginLeft: '8px' }}>
              ({user.role.toUpperCase()})
            </strong>
          )}
        </p>
        <Code type="user" token={user.qr_token} label="QR de membresía y retiros" />
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

      {/* Accesos Rápidos según Rol */}
      <div className="quick-grid" style={{ marginBottom: '32px' }}>
        {user.role === 'admin' && (
          <Link
            className="card"
            href="/admin/overview"
            style={{ borderColor: 'rgba(212, 162, 76, 0.4)' }}
          >
            <LayoutDashboard style={{ color: '#D4A24C' }} />
            <h3 style={{ color: '#D4A24C' }}>Panel de Administración</h3>
            <p>Control de tiendas, analítica y gestión general.</p>
          </Link>
        )}
        {user.role === 'comercio' && (
          <Link
            className="card"
            href="/comercio"
            style={{ borderColor: 'rgba(255, 107, 26, 0.4)' }}
          >
            <Building2 style={{ color: '#FF6B1A' }} />
            <h3 style={{ color: '#FF6B1A' }}>Mi Establecimiento & Caja</h3>
            <p>Escanear QRs, validar pedidos y ver productos.</p>
          </Link>
        )}
        <Link className="card" href="/cliente/puntos">
          <Gift />
          <h3>Mis Beneficios</h3>
          <p>Descubre qué puedes canjear con tus puntos.</p>
        </Link>
        <Link className="card" href="/cliente/pedidos">
          <ShieldCheck />
          <h3>Mis Pedidos</h3>
          <p>Consulta tus retiros Click & Collect en curso.</p>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Formulario de Datos Personales */}
        <section className="form-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#fff',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <UserRound size={18} style={{ color: '#FF6B1A' }} />
            Información Personal
          </h3>
          <p className="muted" style={{ fontSize: '12px', marginBottom: '16px' }}>
            Mantén tus datos actualizados para tus pedidos y acreditación de beneficios.
          </p>

          <form onSubmit={handleUpdateProfile} className="form-stack">
            <label>
              Nombre completo
              <input
                type="text"
                required
                value={name || user.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </label>

            <label>
              Correo electrónico <span className="muted">(identificador de cuenta)</span>
              <input
                type="email"
                disabled
                value={user.email}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Celular / WhatsApp
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+591 70000000"
                />
              </label>
              <label>
                Fecha de nacimiento
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </label>
            </div>

            <button
              className="button"
              disabled={busyInfo}
              style={{ marginTop: '8px', alignSelf: 'flex-start' }}
            >
              {busyInfo ? 'Guardando…' : 'Guardar Datos Personales'}
            </button>
          </form>
        </section>

        {/* Formulario de Cambio de Contraseña */}
        <section className="form-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#fff',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Lock size={18} style={{ color: '#D4A24C' }} />
            Seguridad & Contraseña
          </h3>
          <p className="muted" style={{ fontSize: '12px', marginBottom: '16px' }}>
            Cambia tu contraseña temporal por una definitiva o actualiza tu clave de acceso.
          </p>

          <form onSubmit={handleChangePassword} className="form-stack">
            <label>
              Contraseña actual
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu clave actual o temporal"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva clave"
                />
              </label>
            </div>

            <button
              className="button light"
              disabled={busyPass}
              style={{ marginTop: '8px', alignSelf: 'flex-start' }}
            >
              {busyPass ? 'Actualizando…' : 'Actualizar Contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
