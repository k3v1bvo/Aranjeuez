'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Gift, Mail, ShieldCheck, Sparkles, UserRound, ArrowRight, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api, useSession } from './Providers';
import { getPublicDB } from '@/lib/paseo/supabase';
import type { User } from '@/lib/paseo/model';
import { homeFor, levelFor } from '@/lib/paseo/model';
import { ErrorState, Loading, PageTitle } from './UI';
import { Code } from './Code';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { ChakanaIcon } from './ChakanaIcon';

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
      setError(err?.message || 'Error al conectar con Google OAuth.');
      toast.error('No se pudo iniciar sesión con Google.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      action: register ? 'register' : 'login',
      email: String(form.get('email') || '').trim().toLowerCase(),
      password: String(form.get('password') || ''),
    };
    if (register) {
      body.name = String(form.get('name') || '').trim();
      body.phone = String(form.get('phone') || '').trim() || null;
      body.birthday = String(form.get('birthday') || '').trim() || null;
      body.role = 'cliente';
    }
    try {
      const response = await api<{ user: User }>('auth', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setUser(response.user);
      toast.success(register ? '¡Cuenta creada con éxito!' : '¡Bienvenido de vuelta!');
      router.push(homeFor(response.user.role));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos iniciar sesión.';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-12 sm:py-16 px-4 max-w-xl mx-auto">
      <div className="rounded-3xl glass-andino border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Marca de agua Chakana dorada */}
        <div className="absolute -top-12 -right-12 w-64 h-64 opacity-10 pointer-events-none text-[#D4A24C]">
          <ChakanaIcon size={256} rotateOnHover={false} />
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <PaseoAranjuezLogo size="lg" showSubtitle={true} />
          </div>
          <span className="text-xs uppercase font-bold text-[#D4A24C] tracking-widest block mb-1">
            {register ? 'Registro Oficial de Clientes' : 'Acceso Seguro a tu Cuenta'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
            {register ? 'Crea tu Cuenta en el Paseo' : 'Iniciar Sesión'}
          </h1>
          <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
            {register
              ? 'Acumula puntos en cada compra y retira tus pedidos sin filas.'
              : 'Ingresa para ver tus compras, saldo de puntos y códigos de retiro.'}
          </p>
        </div>

        {/* Botón Google OAuth Oficial */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-white/95 text-gray-800 font-bold text-sm shadow-md transition-all mb-5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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

        <div className="flex items-center gap-3 my-5 text-xs text-white/40 uppercase tracking-wider">
          <div className="flex-1 h-px bg-white/10" />
          <span>O con correo electrónico</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {register && (
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Nombre completo
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ej. Mateo Quiroga"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
            />
          </div>

          {register && (
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Celular <span className="text-white/40">(opcional)</span>
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+591 ..."
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400 py-1">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm shadow-xl shadow-[#FF6B1A]/20 btn-primary-andino disabled:opacity-50"
          >
            {busy ? 'Procesando…' : register ? 'Crear mi Cuenta' : 'Ingresar'}
          </button>
        </form>

        <p className="text-xs text-white/60 text-center mt-6">
          {register ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <Link
            href={register ? '/auth/login' : '/auth/registro'}
            className="text-[#FF6B1A] font-bold hover:underline ml-1"
          >
            {register ? 'Inicia sesión aquí' : 'Regístrate gratis'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function Profile() {
  const { user, loading, error, refresh } = useSession();

  if (loading)
    return (
      <div className="py-24 text-center">
        <Loading label="Cargando perfil…" />
      </div>
    );

  if (error)
    return (
      <div className="py-24 px-4 max-w-4xl mx-auto">
        <ErrorState message={error} retry={refresh} />
      </div>
    );

  if (!user)
    return (
      <div className="py-24 px-4 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Inicia sesión para ver tu perfil</h2>
        <Link
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm"
          href="/auth/login"
        >
          Iniciar sesión
        </Link>
      </div>
    );

  const level = levelFor(user.lifetime_points);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Tarjeta de Membresía Digital */}
      <div className="rounded-3xl glass-andino border-2 border-[#D4A24C]/40 p-8 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 opacity-15 pointer-events-none text-[#D4A24C]">
          <ChakanaIcon size={256} rotateOnHover={false} />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/40 text-xs font-bold text-[#D4A24C] uppercase tracking-wider">
                Membresía Paseo
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                Nivel {level.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">{user.name}</h1>
            <p className="text-xs text-white/60 mt-0.5">{user.email}</p>

            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-black text-white font-mono">{user.points}</span>
              <span className="text-sm font-bold text-[#D4A24C]">Paseo Points disponibles</span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/10 text-center">
            <Code type="user" token={user.qr_token} label="QR de Membresía" />
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/cliente/puntos"
          className="rounded-3xl glass-andino border border-white/10 p-6 hover:border-[#FF6B1A]/40 transition-all shadow-lg flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase font-bold text-[#D4A24C] block mb-1">Fidelidad</span>
            <h3 className="text-xl font-bold text-white group-hover:text-[#FF6B1A] transition-colors">
              Paseo Points & Beneficios
            </h3>
            <p className="text-xs text-white/60 mt-1">Canjea cafés, combos y descuentos.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#FF6B1A] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/cliente/pedidos"
          className="rounded-3xl glass-andino border border-white/10 p-6 hover:border-[#FF6B1A]/40 transition-all shadow-lg flex items-center justify-between group"
        >
          <div>
            <span className="text-xs uppercase font-bold text-[#FF6B1A] block mb-1">Click & Collect</span>
            <h3 className="text-xl font-bold text-white group-hover:text-[#FF6B1A] transition-colors">
              Mis Pedidos & Códigos
            </h3>
            <p className="text-xs text-white/60 mt-1">Revisa tus retiros activos en el mall.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#FF6B1A] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
