'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { usePaseoToast } from './PaseoToast';
import { getPublicDB } from '@/lib/paseo/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (userData: {
    name: string;
    role: 'cliente' | 'comercio' | 'empleado' | 'admin';
  }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const router = useRouter();
  const { showToast } = usePaseoToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [accountType] = useState<'cliente' | 'comercio'>('cliente');
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
        showToast(
          'Correo enviado',
          'success',
          'Revisa tu bandeja de entrada o spam. Te enviamos una contraseña temporal.',
        );
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
        `Sesión iniciada como ${user.name}`,
      );

      if (onSuccessLogin) {
        onSuccessLogin({ name: user.name, role: user.role });
      }

      onClose();

      // Redirect depending on role
      if (user.role === 'admin') {
        router.push('/admin/overview');
      } else if (user.role === 'comercio' || user.role === 'empleado') {
        router.push('/comercio');
      } else {
        router.push('/cliente');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al autenticar');
      showToast(
        'Error de autenticación',
        'error',
        err instanceof Error ? err.message : 'No se pudo procesar la solicitud',
      );
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo conectar con Google');
      showToast('Google OAuth', 'error', err instanceof Error ? err.message : 'Error de conexión');
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Nombre Completo
              </label>
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
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">
                    Nombre de la Tienda
                  </label>
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
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">
                    Categoría
                  </label>
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
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">
                    Piso / Planta
                  </label>
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
                  <label className="text-[11px] font-semibold text-[#D4A24C] block mb-1">
                    Local (Número)
                  </label>
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
            <label className="text-xs font-semibold text-white/80 block mb-1">
              Correo Electrónico
            </label>
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
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Celular (Opcional)
              </label>
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
