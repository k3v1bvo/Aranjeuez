'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { 
  QrCode, Copy, Printer, RefreshCw, Sparkles, MapPin, 
  Clock, ShieldCheck, Flame, CheckCircle2, Radio, ExternalLink, X 
} from 'lucide-react';
import { toast } from 'sonner';
import { api, useResource } from './Providers';
import { PageTitle, Loading, ErrorState, Empty } from './UI';

interface TotemStation {
  id: string;
  code: string;
  name: string;
  floor: string;
  z: number;
  x: number;
  y: number;
  points: number;
  subtitle: string;
  description: string;
}

const STATIONS: TotemStation[] = [
  {
    id: 'totem-lobby',
    code: 'PASEO-TOTEM-LOBBY',
    name: 'Tótem Entrada Principal & Lobby',
    floor: 'Planta Baja',
    z: 0,
    x: 50,
    y: 88,
    points: 5,
    subtitle: 'Acceso Av. América (Puerta 1)',
    description: 'Punto de bienvenida para visitantes que ingresan por la fachada principal.'
  },
  {
    id: 'totem-pando',
    code: 'PASEO-TOTEM-PANDO',
    name: 'Tótem Acceso Boulevard Pando',
    floor: 'Planta Baja',
    z: 0,
    x: 20,
    y: 75,
    points: 5,
    subtitle: 'Ingreso Peatonal Oeste',
    description: 'Punto de ingreso directo a la zona de cafeterías y bancos.'
  },
  {
    id: 'totem-terraza',
    code: 'PASEO-TOTEM-TERRAZA',
    name: 'Checkpoint Mirador & Terraza',
    floor: 'Piso 3 · Terraza Gastronómica',
    z: 3,
    x: 75,
    y: 25,
    points: 10,
    subtitle: 'Mirador Panorámico Aranjuez',
    description: 'Bonus especial para incentivar a los clientes a subir y disfrutar de la gastronomía.'
  },
  {
    id: 'totem-parking',
    code: 'PASEO-TOTEM-PARKING',
    name: 'Estación Parking & Click & Collect',
    floor: 'Subsuelo 1',
    z: -1,
    x: 45,
    y: 40,
    points: 5,
    subtitle: 'Lobby de Elevadores Estacionamiento',
    description: 'Check-in para clientes que llegan en vehículo a retirar pedidos PaseoYa.'
  }
];

export function QrStationManager() {
  const { data, loading, error, reload } = useResource<{
    audit: Array<{
      id: string;
      action: string;
      detail: Record<string, unknown>;
      created_at: string;
      actor_id: string;
    }>;
    movements: Array<{
      id: string;
      amount: number;
      reason: string;
      created_at: string;
      user?: { name: string };
      store?: { name: string };
    }>;
  }>('resumen', 15000);

  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [printStation, setPrintStation] = useState<TotemStation | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    async function generateQrs() {
      const urls: Record<string, string> = {};
      for (const st of STATIONS) {
        try {
          const url = await QRCode.toDataURL(st.code, {
            width: 320,
            margin: 2,
            color: {
              dark: '#030B1A',
              light: '#FFFFFF',
            },
          });
          urls[st.code] = url;
        } catch (e) {
          console.error('Error generating QR for', st.code, e);
        }
      }
      setQrImages(urls);
    }
    generateQrs();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles', { description: code });
  };

  const handleSimulateScan = async (station: TotemStation) => {
    setSimulating(true);
    try {
      const res = await api<{ ok: boolean; message: string; pointsAwarded?: number }>('checkin', {
        method: 'POST',
        body: JSON.stringify({ code: station.code }),
      });
      toast.success(res.message || 'Escaneo simulado con éxito', {
        description: `+${res.pointsAwarded || station.points} pts asignados · Telemetría (${station.x}, ${station.y}, ${station.z})`,
      });
      reload();
    } catch (e) {
      toast.info(e instanceof Error ? e.message : 'No se pudo simular');
    } finally {
      setSimulating(false);
    }
  };

  // Filtrar eventos de telemetría recientes
  const telemetryLogs = (data?.audit || [])
    .filter(a => a.action === 'telemetry_scan' || (a.detail && (a.detail.x !== undefined || a.detail.totem_code)))
    .slice(0, 30);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageTitle
        eyebrow="Control de Acceso & Telemetría Espacial"
        title="Tótems Físicos & Monitoreo de Escaneos QR"
        description="Genera los códigos QR oficiales para los atriles de ingreso del Paseo. Monitorea en tiempo real qué clientes escanean y sus coordenadas (X, Y, Z)."
      >
        <button className="button secondary small flex items-center gap-1.5" onClick={reload}>
          <RefreshCw size={15} /> Actualizar Feed
        </button>
      </PageTitle>

      {/* Grid de Tótems Oficiales para Generar e Imprimir */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="text-[#FF6B1A]" size={20} />
            Estaciones de Tótems Físicos
          </h2>
          <span className="text-xs text-white/50">Listos para imprimir y colocar en pedestales</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATIONS.map((station) => (
            <article 
              key={station.id}
              className="p-5 rounded-2xl bg-[#061734]/80 border border-white/10 flex flex-col justify-between hover:border-[#FF6B1A]/40 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] border border-[#FF6B1A]/30">
                    +{station.points} pts
                  </span>
                  <span className="text-[10px] font-mono text-white/60">
                    Piso Z: {station.z}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug mb-1">
                  {station.name}
                </h3>
                <p className="text-xs text-[#D4A24C] font-semibold mb-3">
                  {station.floor} · {station.subtitle}
                </p>

                {/* Preview del Código QR */}
                <div className="p-3 bg-white rounded-xl flex items-center justify-center my-3 shadow-inner">
                  {qrImages[station.code] ? (
                    <Image
                      src={qrImages[station.code]}
                      alt={station.name}
                      width={160}
                      height={160}
                      unoptimized
                      className="rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-black/40 text-xs">
                      Generando QR...
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-white/50 font-sans leading-relaxed mb-4">
                  {station.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>Coord: ({station.x}%, {station.y}%)</span>
                  <span>{station.code}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopy(station.code)}
                    className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-1.5 transition-all"
                    title="Copiar token numérico"
                  >
                    <Copy size={13} /> Copiar
                  </button>
                  <button
                    onClick={() => setPrintStation(station)}
                    className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#B84D0B] hover:bg-[#FF6B1A] text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                    title="Ver ficha de impresión para mostrador"
                  >
                    <Printer size={13} /> Imprimir
                  </button>
                </div>

                <button
                  onClick={() => handleSimulateScan(station)}
                  disabled={simulating}
                  className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-white/60 hover:text-white hover:bg-white/5 border border-white/10 transition-all text-center"
                >
                  ⚡ Probar escaneo como cliente
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Monitor en Vivo de Escaneos y Telemetría */}
      <section className="p-6 rounded-3xl bg-[#061734]/60 border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Feed de Telemetría en Vivo (Cada 15s)</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Historial de Escaneos Recientes de Visitantes
            </h2>
            <p className="text-xs text-white/50">
              Registros capturados silenciosamente cuando el cliente interactúa con tótems o locales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
              <MapPin size={14} className="text-[#FF6B1A]" />
              <span>Geocerca: <strong>200m</strong> alrededor del edificio</span>
            </div>
            <Link
              href="/admin/settings"
              className="px-3 py-1.5 rounded-xl bg-[#FF6B1A]/10 hover:bg-[#FF6B1A]/20 border border-[#FF6B1A]/30 text-xs text-[#FF6B1A] font-bold transition-all text-center"
            >
              Configurar Radio en Ajustes →
            </Link>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !telemetryLogs.length ? (
          <Empty 
            title="Sin escaneos registrados aún"
            detail="Usa los botones de 'Probar escaneo' arriba o escanea un QR en mostrador para ver la telemetría en vivo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Hora</th>
                  <th className="pb-3">Punto / Tótem</th>
                  <th className="pb-3">Nivel (Z)</th>
                  <th className="pb-3">Coordenadas (X, Y)</th>
                  <th className="pb-3">Puntos</th>
                  <th className="pb-3">Geocerca / GPS</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 pr-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {telemetryLogs.map((log) => {
                  const d = (log.detail || {}) as Record<string, unknown>;
                  const time = new Date(log.created_at).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-2 font-mono text-white/50">{time}</td>
                      <td className="py-3">
                        <strong className="text-white block">
                          {String(d.totem_name || d.store_name || d.sector || 'Punto de Acceso')}
                        </strong>
                        <span className="text-[10px] text-white/40">
                          {String(d.totem_code || d.store_id || log.actor_id?.slice(0, 8))}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-[#D4A24C]">
                        {String(d.floor || `Piso ${d.z ?? 0}`)}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-emerald-400">
                        {d.x !== undefined && d.y !== undefined ? `X:${d.x}%, Y:${d.y}%` : 'Planta Central'}
                      </td>
                      <td className="py-3 font-bold text-[#FF6B1A]">
                        {d.points_granted ? `+${d.points_granted} pts` : d.amount ? `Bs. ${d.amount}` : '+5 pts'}
                      </td>
                      <td className="py-3 font-mono text-[11px]">
                        {d.distance_meters !== undefined && d.distance_meters !== null ? (
                          <span className={d.in_geofence ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                            {d.in_geofence ? '🟢' : '📍'} {Number(d.distance_meters)}m
                          </span>
                        ) : (
                          <span className="text-white/40">Tótem Físico</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 uppercase">
                          {String(d.type || log.action || 'qr_scan')}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={12} /> Procesado
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Ficha Imprimible de Tótem Oficial */}
      {printStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-8 bg-[#030B1A] border border-[#FF6B1A]/40 rounded-3xl text-center shadow-2xl space-y-5">
            <button
              onClick={() => setPrintStation(null)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full bg-white/5"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Ficha Oficial de Tótem
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                PASEO ARANJUEZ
              </h3>
              <p className="text-xs text-[#D4A24C] font-bold mt-1">
                {printStation.name}
              </p>
              <p className="text-[11px] text-white/60">
                {printStation.floor} · {printStation.subtitle}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto">
              {qrImages[printStation.code] && (
                <Image
                  src={qrImages[printStation.code]}
                  alt={printStation.name}
                  width={220}
                  height={220}
                  unoptimized
                  className="rounded-xl"
                />
              )}
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1">
              <p className="font-bold text-white">📲 Escanea este QR al ingresar con tu celular</p>
              <p className="text-emerald-400 font-bold">¡Suma +{printStation.points} Paseo Points de bienvenida!</p>
              <p className="text-[10px] text-white/40 font-mono mt-1">{printStation.code}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B84D0B] to-[#FF6B1A] text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Enviar a Imprimir
              </button>
              <button
                onClick={() => setPrintStation(null)}
                className="py-3 px-5 rounded-xl font-semibold text-xs bg-white/10 text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}