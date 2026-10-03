'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Sparkles, CheckCircle2, MapPin, Award, ArrowRight, 
  LogIn, Compass, Flame, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';
import { api, useSession } from '@/components/paseo/Providers';
import { findStation, PENDING_QR_KEY } from '@/lib/paseo/stations';
import { PaseoAranjuezLogo } from '@/components/paseo/PaseoAranjuezLogo';

export default function QrCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params?.code) ? params.code[0] : (params?.code as string);
  const station = findStation(rawCode);

  const { user, loading } = useSession();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    pointsAwarded?: number;
    alreadyCheckedIn?: boolean;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!station) return;

    // Si el usuario aún no está logueado, guardamos el código pendiente
    if (!loading && !user) {
      try {
        localStorage.setItem(PENDING_QR_KEY, station.code);
      } catch {}
      return;
    }

    if (!loading && user && !result && !checking && !errorMsg) {
      setChecking(true);
      
      const doCheckin = (coords?: { lat: number; lng: number } | null) => {
        api<{
          ok: boolean;
          pointsAwarded?: number;
          alreadyCheckedIn?: boolean;
          message: string;
        }>('checkin', {
          method: 'POST',
          body: JSON.stringify({
            code: station.code,
            userLat: coords?.lat,
            userLng: coords?.lng,
          }),
        })
          .then((res) => {
            setResult(res);
            try {
              localStorage.removeItem(PENDING_QR_KEY);
            } catch {}
          })
          .catch((err) => {
            setErrorMsg(err instanceof Error ? err.message : 'No pudimos validar tu ingreso.');
          })
          .finally(() => {
            setChecking(false);
          });
      };

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => doCheckin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => doCheckin(null),
          { timeout: 4000, enableHighAccuracy: true }
        );
      } else {
        doCheckin(null);
      }
    }
  }, [station, status, user, result, checking, errorMsg]);

  if (!station) {
    return (
      <div className="min-h-screen bg-[#030B1A] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#061734] border border-red-500/30 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Código QR No Reconocido</h2>
          <p className="text-xs text-white/60">
            El código <code className="text-[#FF6B1A] font-mono">{rawCode}</code> no corresponde a una estación oficial de Paseo Aranjuez.
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
          >
            Ir al Inicio del Paseo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030B1A] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Luces de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FF6B1A]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D4A24C]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-lg mx-auto w-full pt-4">
        <Link href="/" className="inline-block">
          <PaseoAranjuezLogo className="h-9 w-auto text-white" />
        </Link>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
          Estación {station.floorLabel}
        </span>
      </header>

      {/* Tarjeta Central */}
      <main className="relative z-10 max-w-md mx-auto w-full my-8">
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#061734]/90 border border-white/15 shadow-2xl backdrop-blur-xl text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84D0B]/20 to-[#D4A24C]/20 border border-[#FF6B1A]/40 text-xs font-bold uppercase tracking-wider text-[#FF6B1A]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B1A]" />
            <span>Mapeo Peatonal & Recompensas</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
              {station.name}
            </h1>
            <p className="text-sm font-semibold text-[#D4A24C] mt-1">
              {station.floorLabel} · Nivel Z {station.z}
            </p>
            <p className="text-xs text-white/60 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
              <span>{station.place}</span>
            </p>
          </div>

          {/* Estado de carga o validación */}
          {loading || checking ? (
            <div className="py-8 space-y-3">
              <RefreshCw className="w-10 h-10 text-[#FF6B1A] animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">Validando tu ubicación y visita...</p>
              <p className="text-xs text-white/50">Conectando con la telemetría del edificio Paseo Aranjuez.</p>
            </div>
          ) : result ? (
            /* Resultado de éxito o visita ya registrada */
            <div className="p-5 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  {result.pointsAwarded && result.pointsAwarded > 0
                    ? `¡Ganaste +${result.pointsAwarded} Paseo Points!`
                    : 'Visita Registrada'}
                </h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  {result.message}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/cliente/puntos"
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Award size={15} /> Ver Mi Billetera de Puntos
                </Link>
                <Link
                  href="/#mapa"
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Layers size={14} /> Ver Plano & Tiendas de Este Piso
                </Link>
              </div>
            </div>
          ) : errorMsg ? (
            /* Error en checkin */
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-xs text-red-200 leading-relaxed">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setChecking(false);
                }}
                className="py-2 px-4 rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Reintentar
              </button>
            </div>
          ) : (
            /* Usuario No Autenticado */
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-3xl font-black text-[#FF6B1A]">
                  +{station.points} pts
                </span>
                <p className="text-xs font-bold text-white">
                  Gana puntos gratis al recorrer este piso
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Inicia sesión o crea tu cuenta en 10 segundos para acreditar estos puntos a tu billetera Club Paseo.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/auth/login?redirect=/qr/${station.code}`}
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <LogIn size={15} /> Iniciar Sesión para Sumar Puntos
                </Link>
                <Link
                  href={`/auth/registro?redirect=/qr/${station.code}`}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  Crear Cuenta Nueva (+20 pts de Bienvenida)
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-white/40 pb-4">
        Paseo Aranjuez Cochabamba · Av. América & Pantaleón Dalence
      </footer>
    </div>
  );
}
