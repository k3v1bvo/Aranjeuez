'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Lock, Mail, Phone, User, AlertCircle, Loader2 } from 'lucide-react';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { usePaseoToast } from './PaseoToast';
import { getPublicDB } from '@/lib/paseo/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (userData: { name: string; role: 'cliente' | 'comercio' | 'admin' }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const router = useRouter();
  const { showToast } = usePaseoToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);

    try {
      const payload =
        activeTab === 'login'
          ? { action: 'login', email: email.trim().toLowerCase(), password }
          : {
              action: 'register',
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim() || undefined,
              password,
            };

      const res = await fetch('/api/paseo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas o error en el servidor.');
      }

      const user = data.user;
      showToast(
        activeTab === 'login' ? '¡Bienvenido de vuelta!' : '¡Cuenta creada con éxito!',
        'success',
        `Sesión iniciada como ${user.name}`
      );

      if (onSuccessLogin) {
        onSuccessLogin({ name: user.name, role: user.role });
      }

      onClose();

      // Redirect depending on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'comercio') {
        router.push('/comercio');
      } else {
        router.push('/cliente');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar');
      showToast('Error de autenticación', 'error', err.message || 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setBusy(true);
      setErrorMsg(null);
      const supabase = getPublicDB();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con Backdrop blur */}
      <div
        className="fixed inset-0 bg-[#030B1A]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0B1528] to-[#040C1E] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl text-white z-10 overflow-hidden">
        {/* Línea LED Superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B84D0B] via-[#FF6B1A] to-[#D4A24C]" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header con Logo */}
        <div className="flex flex-col items-center text-center mt-1 mb-6">
          <PaseoAranjuezLogo size="sm" showSubtitle={false} />
          <h3 className="text-2xl font-black tracking-tight mt-2">
            {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {activeTab === 'login'
              ? 'Accede con tus credenciales a Paseo Points y PaseoYa'
              : 'Únete para acumular puntos y comprar con Click & Collect en Paseo Aranjuez'}
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botón Oficial Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy}
          className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] mb-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{activeTab === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#081122] text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            o con correo y contraseña
          </span>
        </div>

        {/* Tabs Iniciar Sesión / Registro */}
        <div className="flex border-b border-white/15 mb-5 relative">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold relative transition-colors ${
              activeTab === 'login' ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Ingresar
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B1A] transition-all" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold relative transition-colors ${
              activeTab === 'register' ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Registrarse
            {activeTab === 'register' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B1A] transition-all" />
            )}
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div className="relative">
              <label className="block text-xs font-semibold text-white/70 mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B1A]"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <label className="block text-xs font-semibold text-white/70 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B1A]"
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="relative">
              <label className="block text-xs font-semibold text-white/70 mb-1">Celular (+591)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
                <input
                  type="tel"
                  placeholder="70000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B1A]"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <label className="block text-xs font-semibold text-white/70 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B1A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-[#FF6B1A]/20 flex items-center justify-center gap-2 group mt-4 transition-all disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Ingresar a Paseo Aranjuez' : 'Crear Mi Cuenta'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
