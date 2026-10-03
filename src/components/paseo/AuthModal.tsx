'use client';

import React, { useState } from 'react';
import { X, User, Store, Shield, ArrowRight, Lock, Mail, Phone, CheckCircle, Sparkles } from 'lucide-react';
import { PaseoAranjuezLogo } from './PaseoAranjuezLogo';
import { usePaseoToast } from './PaseoToast';
import { MOCK_USER } from '@/lib/mock-data';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (userData: { name: string; role: 'cliente' | 'comercio' | 'admin' }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const { showToast } = usePaseoToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'cliente' | 'comercio' | 'admin'>('cliente');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userName = activeTab === 'login' ? (email.split('@')[0] || MOCK_USER.name) : (name || 'Nuevo Usuario');
    
    showToast(
      activeTab === 'login' ? '¡Bienvenido de vuelta!' : '¡Cuenta creada con éxito!',
      'success',
      `Sesión iniciada como ${userName} (${selectedRole.toUpperCase()})`
    );

    if (onSuccessLogin) {
      onSuccessLogin({ name: userName, role: selectedRole });
    }
    onClose();
  };

  const handleQuickDemoLogin = (role: 'cliente' | 'comercio' | 'admin') => {
    setSelectedRole(role);
    const demoNames: Record<string, string> = {
      cliente: 'Mateo Quiroga',
      comercio: 'Don Mateo Grill (Piso 3)',
      admin: 'SuperAdmin Aranjuez',
    };
    showToast('Acceso Rápido Demo Activado', 'info', `Ingresando como ${demoNames[role]}`);
    if (onSuccessLogin) {
      onSuccessLogin({ name: demoNames[role], role });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con Backdrop blur (Regla 15: fade-in 200ms con blur) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#030B1A]/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Contenido del Modal (Regla 15: scale 0.95 -> 1, 300ms expo-out) */}
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#061734] border border-[#FF6B1A]/30 p-7 text-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 fade-in"
        style={{
          boxShadow: '0 25px 60px -15px rgba(184, 77, 11, 0.45)',
          animationDuration: '300ms',
          animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Línea LED Superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 led-effect" />

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
          <h3 className="text-2xl font-black font-display tracking-tight mt-2">
            {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {activeTab === 'login'
              ? 'Accede a tu cuenta de Paseo Points y pedidos PaseoYa'
              : 'Únete para acumular puntos por cada compra en el centro comercial'}
          </p>
        </div>

        {/* Selector de Rol */}
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setSelectedRole('cliente')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'cliente'
                ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('comercio')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'comercio'
                ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Comercio</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Tabs Iniciar Sesión / Registro (Regla 13) */}
        <div className="flex border-b border-white/15 mb-5 relative">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
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
            onClick={() => setActiveTab('register')}
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

        {/* Formulario con Inputs Floating Label (Regla 17) */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div className="floating-input-group">
              <input
                id="name-input"
                type="text"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="floating-input"
              />
              <label htmlFor="name-input" className="floating-label">
                Nombre Completo
              </label>
            </div>
          )}

          <div className="floating-input-group">
            <input
              id="email-input"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="floating-input"
            />
            <label htmlFor="email-input" className="floating-label">
              Correo Electrónico
            </label>
          </div>

          {activeTab === 'register' && (
            <div className="floating-input-group">
              <input
                id="phone-input"
                type="tel"
                placeholder=" "
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="floating-input"
              />
              <label htmlFor="phone-input" className="floating-label">
                Número de Celular (+591)
              </label>
            </div>
          )}

          <div className="floating-input-group">
            <input
              id="password-input"
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="floating-input"
            />
            <label htmlFor="password-input" className="floating-label">
              Contraseña
            </label>
          </div>

          {/* Botón Principal (Regla 3: scale 1.02, translateY -2px) */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white font-bold text-sm btn-primary-andino flex items-center justify-center gap-2 group mt-2"
          >
            <span>{activeTab === 'login' ? 'Acceder al Ecosistema' : 'Crear Mi Cuenta'}</span>
            <ArrowRight className="w-4 h-4 arrow-icon group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#061734] text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Accesos Rápidos Demo
          </span>
        </div>

        {/* Botones de Acceso Rápido para Hackathon */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('cliente')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-all btn-pill-andino"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span className="truncate">Demo: Mateo (Cliente)</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('comercio')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-all btn-pill-andino"
          >
            <Store className="w-3.5 h-3.5 text-[#FF6B1A]" />
            <span className="truncate">Demo: Don Mateo Grill</span>
          </button>
        </div>
      </div>
    </div>
  );
}
