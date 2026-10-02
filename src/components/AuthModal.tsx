'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, X, CheckCircle2, ArrowRight, Key, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { tacticalAudio } from '@/lib/tactical-audio';
import type { AppRole } from '@/lib/types';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signIn,
    signUp,
    signInWithGoogle,
    isLoggedIn,
    userName,
    userEmail,
    role,
    signOut,
    switchDemoRole,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        tacticalAudio.playBlip();
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    tacticalAudio.playLockOn();

    if (tab === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName, phone);
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    tacticalAudio.playLockOn();
    await signInWithGoogle();
  };

  const handleDemoSwitch = (r: AppRole) => {
    tacticalAudio.playBlip();
    switchDemoRole(r);
    closeAuthModal();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-2xl animate-fade-in transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          tacticalAudio.playBlip();
          closeAuthModal();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Centered Modal Card: Flawlessly centered on PC, Tablet, and Mobile */}
      <div
        className="relative w-full max-w-[440px] my-auto rounded-3xl border border-[#C8A961]/35 bg-[#0B0B10]/98 text-left shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(200,169,97,0.18)] max-h-[92dvh] flex flex-col overflow-hidden"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Top laser accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A961] to-transparent" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#22222A] bg-gradient-to-b from-[#14141C] to-[#0B0B10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8A961]/15 border border-[#C8A961]/30 flex items-center justify-center text-[#C8A961] shadow-inner">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#C8A961] tracking-widest uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C] animate-pulse" />
                ACCESO SEGURO MIL-SPEC
              </div>
              <h3 id="auth-modal-title" className="text-base sm:text-lg font-extrabold text-white uppercase tracking-tight">
                PORTAL DE OPERADORES
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playBlip();
              closeAuthModal();
            }}
            aria-label="Cerrar modal"
            className="w-10 h-10 rounded-xl bg-[#14141A] border border-[#22222A] text-[#7A7A85] hover:text-white hover:border-[#C8A961]/40 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* If user is already logged in */}
          {isLoggedIn ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-[#30A46C]/10 border border-[#30A46C]/25 text-left">
                <div className="flex items-center gap-2 text-xs font-mono text-[#30A46C] font-bold mb-1">
                  <CheckCircle2 size={16} /> OPERADOR AUTENTICADO
                </div>
                <div className="text-sm font-bold text-white">{userName}</div>
                <div className="text-xs text-[#7A7A85] font-mono">{userEmail}</div>
                <div className="mt-2 text-[10px] font-mono text-[#C8A961] uppercase">
                  ROL ASIGNADO: <strong className="text-white">{role.toUpperCase()}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  signOut();
                  closeAuthModal();
                }}
                className="btn-outline-gold w-full min-h-[48px] text-xs font-bold py-3 flex items-center justify-center"
              >
                CERRAR SESIÓN DEL DISPOSITIVO
              </button>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#121218] border border-[#22222A] font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playBlip();
                    setTab('login');
                  }}
                  className={`min-h-[42px] rounded-xl font-bold transition-all ${
                    tab === 'login'
                      ? 'bg-[#C8A961] text-black shadow-md'
                      : 'text-[#7A7A85] hover:text-white'
                  }`}
                >
                  INICIAR SESIÓN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playBlip();
                    setTab('register');
                  }}
                  className={`min-h-[42px] rounded-xl font-bold transition-all ${
                    tab === 'register'
                      ? 'bg-[#C8A961] text-black shadow-md'
                      : 'text-[#7A7A85] hover:text-white'
                  }`}
                >
                  REGISTRO
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'register' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono text-[#A1A1AA] uppercase mb-1.5 font-semibold">
                        NOMBRE COMPLETO *
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A85]" />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ej. Roberto Vargas"
                          className="w-full min-h-[48px] bg-[#14141C] border border-[#262632] text-xs text-white rounded-xl pl-10 pr-4 py-3 focus:border-[#C8A961] focus:ring-1 focus:ring-[#C8A961]/40 focus:outline-none font-sans transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-[#C8A961] uppercase mb-1.5 font-semibold flex items-center justify-between">
                        <span>TELÉFONO / WHATSAPP *</span>
                        <span className="text-[#7A7A85]">+591 BOLIVIA</span>
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                        <input
                          type="tel"
                          required
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ej. 71234567 o 60012345"
                          className="w-full min-h-[48px] bg-[#14141C] border border-emerald-500/30 text-xs text-white rounded-xl pl-10 pr-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none font-mono transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-[#7A7A85] mt-1 font-mono">
                        Para coordinar despachos directos, alertas de entrega y WhatsApp.
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-[#A1A1AA] uppercase mb-1.5 font-semibold">
                    CORREO ELECTRÓNICO
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A85]" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operador@tacticos.bo"
                      className="w-full min-h-[48px] bg-[#14141C] border border-[#262632] text-xs text-white rounded-xl pl-10 pr-4 py-3 focus:border-[#C8A961] focus:ring-1 focus:ring-[#C8A961]/40 focus:outline-none font-sans transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#A1A1AA] uppercase mb-1.5 font-semibold">
                    CONTRASEÑA
                  </label>
                  <div className="relative">
                    <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A85]" />
                    <input
                      type="password"
                      required
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full min-h-[48px] bg-[#14141C] border border-[#262632] text-xs text-white rounded-xl pl-10 pr-4 py-3 focus:border-[#C8A961] focus:ring-1 focus:ring-[#C8A961]/40 focus:outline-none font-sans transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-tactical w-full min-h-[48px] text-xs font-bold py-3.5 mt-2 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  <span>{loading ? 'VERIFICANDO ENLACE...' : tab === 'login' ? 'INGRESAR AL SISTEMA' : 'CREAR CUENTA MILITAR'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#22222A]" />
                </div>
                <span className="relative bg-[#0B0B10] px-3 text-[10px] font-mono uppercase text-[#7A7A85]">
                  O ACCESO RÁPIDO
                </span>
              </div>

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full min-h-[48px] rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center gap-3 px-4 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                <span>CONTINUAR CON GOOGLE</span>
              </button>
            </>
          )}

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-[#22222A]">
            <div className="text-[10px] font-mono text-[#7A7A85] uppercase text-center mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles size={11} className="text-[#C8A961]" />
              <span>CAMBIO DE ROL INMEDIATO (MODO SIMULADOR)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSwitch('admin')}
                className="min-h-[42px] px-2 py-2 rounded-xl bg-[#14141C] border border-[#E5484D]/30 hover:border-[#E5484D] text-[#E5484D] text-[10px] font-mono font-bold transition-all hover:bg-[#E5484D]/10"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleDemoSwitch('vendor')}
                className="min-h-[42px] px-2 py-2 rounded-xl bg-[#14141C] border border-[#3b82f6]/30 hover:border-[#3b82f6] text-[#3b82f6] text-[10px] font-mono font-bold transition-all hover:bg-[#3b82f6]/10"
              >
                CHOFER MOTO
              </button>
              <button
                type="button"
                onClick={() => handleDemoSwitch('client')}
                className="min-h-[42px] px-2 py-2 rounded-xl bg-[#14141C] border border-[#30A46C]/30 hover:border-[#30A46C] text-[#30A46C] text-[10px] font-mono font-bold transition-all hover:bg-[#30A46C]/10"
              >
                CLIENTE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
