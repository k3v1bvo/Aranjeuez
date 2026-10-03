'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Lock, Mail, Phone, User, AlertCircle, Loader2, Sparkles, Building2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [accountType, setAccountType] = useState<'cliente' | 'comercio'>('cliente');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Store fields if registering as commerce
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('Comercio');
  const [storeFloor, setStoreFloor] = useState('Piso 1');
  const [storeLocal, setStoreLocal] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'forgot') {
        const res = await fetch('/api/paseo/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'forgot_password', email: email.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar la solicitud.');
        showToast('Correo enviado', 'success', 'Revisa tu bandeja de entrada o spam. Te enviamos una contraseña temporal.');
        setActiveTab('login');
        return;
      }

      const payload =
        activeTab === 'login'
          ? { action: 'login', email: email.trim().toLowerCase(), password }
          : {
              action: 'register',
              accountType,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim() || undefined,
              password,
              ...(accountType === 'comercio'
                ? {
                    storeName: storeName.trim() || undefined,
                    storeCategory,
                    storeFloor,
                    storeLocal: storeLocal.trim() || undefined,
                  }
                : {}),
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
        router.push('/admin/overview');
      } else if (user.role === 'comercio') {
        router.push('/comercio');
      } else {
        router.push('/cliente');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar');
      showToast('Error de autenticación', 'error', err.message || 'No se pudo procesar la solicitud');
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
      setErrorMsg(err.message || 'No se pudo conectar con Google');
      showToast('Google OAuth', 'error', err.message || 'Error de conexión');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#061734] border border-white/15 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <PaseoAranjuezLogo size="md" showSubtitle={true} />
          <h3 className="text-xl font-black text-white font-display mt-4">
            {activeTab === 'login'
              ? 'Iniciar Sesión'
              : activeTab === 'register'
              ? 'Crear Cuenta'
              : 'Recuperar Contraseña'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {activeTab === 'login'
              ? 'Accede a tu cuenta de cliente, comercio o administración'
              : activeTab === 'register'
              ? 'Únete al ecosistema digital de Paseo Aranjuez'
              : 'Te enviaremos una contraseña temporal a tu correo electrónico vía Google SMTP.'}
          </p>
        </div>

        {/* Selector de Tabs */}
        {activeTab !== 'forgot' && (
          <div className="flex rounded-2xl bg-black/40 p-1 mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Tipo de cuenta en registro */}
        {activeTab === 'register' && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAccountType('cliente')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                accountType === 'cliente'
                  ? 'bg-[#FF6B1A]/20 border-[#FF6B1A] text-[#FF6B1A]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Cliente / Visitante</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('comercio')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                accountType === 'comercio'
                  ? 'bg-[#D4A24C]/20 border-[#D4A24C] text-[#D4A24C]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Comercio / Tienda</span>
            </button>
          </div>
        )}

        {/* Google OAuth (solo en login/register) */}
        {activeTab !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-gray-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-md disabled:opacity-50 mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">o con correo</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marcelo Quiroga"
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
                />
              </div>
            </div>
          )}

          {activeTab === 'register' && accountType === 'comercio' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">Nombre de la Tienda</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ej: Samsung Store"
                    className="w-full bg-black/40 border border-[#D4A24C]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4A24C]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">Categoría</label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full bg-black/40 border border-[#D4A24C]/40 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#D4A24C]"
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Moda">Moda & Ropa</option>
                    <option value="Gastronomía">Gastronomía</option>
                    <option value="Belleza">Belleza & Cosmética</option>
                    <option value="Accesorios">Accesorios & Joyería</option>
                    <option value="Servicios">Servicios & Salud</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">Piso / Planta</label>
                  <select
                    value={storeFloor}
                    onChange={(e) => setStoreFloor(e.target.value)}
                    className="w-full bg-black/40 border border-[#D4A24C]/40 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#D4A24C]"
                  >
                    <option value="Planta Baja">Planta Baja</option>
                    <option value="Piso 1">Piso 1</option>
                    <option value="Piso 2">Piso 2</option>
                    <option value="Piso 3">Patio Gastronómico (P3)</option>
                    <option value="Piso 4">Terraza El Cuarto (P4)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">Local (Número)</label>
                  <input
                    type="text"
                    required
                    value={storeLocal}
                    onChange={(e) => setStoreLocal(e.target.value)}
                    placeholder="Ej: Local 105"
                    className="w-full bg-black/40 border border-[#D4A24C]/40 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4A24C]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">Celular (Opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+591 70000000"
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
                />
              </div>
            </div>
          )}

          {activeTab !== 'forgot' && (
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B1A]"
                />
              </div>
              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-[11px] text-[#FF6B1A] hover:underline block text-right mt-1 w-full"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg btn-primary-andino flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : activeTab === 'login' ? (
              <>
                <span>Ingresar a Mi Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : activeTab === 'register' ? (
              <>
                <span>Crear Cuenta {accountType === 'comercio' ? 'de Tienda' : 'Paseo Club'}</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </>
            ) : (
              <>
                <span>Enviar Contraseña Temporal</span>
                <Mail className="w-4 h-4" />
              </>
            )}
          </button>

          {activeTab === 'forgot' && (
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full text-center text-xs text-white/60 hover:text-white mt-2 block"
            >
              ← Volver a Iniciar Sesión
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
