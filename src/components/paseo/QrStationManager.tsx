'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Printer,
  RefreshCw,
  Sparkles,
  MapPin,
  Trash2,
  ShieldCheck,
  Flame,
  CheckCircle2,
  ArrowRight,
  X,
  ExternalLink,
  Layers,
  DoorOpen,
  LogOut,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, useResource } from './Providers';
import { PageTitle, Loading, ErrorState, Empty } from './UI';
import { STATIONS, FLOORS, type FloorId, type Station } from '@/lib/paseo/stations';

export function QrStationManager() {
  const { data, loading, error, reload } = useResource<{
    audit: Array<{
      id: string;
      action: string;
      detail: Record<string, unknown>;
      created_at: string;
      actor_id: string;
    }>;
    settings?: {
      qr_welcome_points?: number;
      qr_entry_points?: number;
      qr_exit_points?: number;
      qr_min_minutes?: number;
    };
  }>('resumen', 15000);

  // Estados para configuración editable de puntos por el Administrador
  const [welcomePts, setWelcomePts] = useState<number>(5);
  const [entryPts, setEntryPts] = useState<number>(1);
  const [exitPts, setExitPts] = useState<number>(2);
  const [minMinutes, setMinMinutes] = useState<number>(2);
  const [savingPoints, setSavingPoints] = useState(false);
  const [pointsPanelOpen, setPointsPanelOpen] = useState(false);

  const [activeFloorFilter, setActiveFloorFilter] = useState<'todos' | FloorId>('todos');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [printStation, setPrintStation] = useState<Station | null>(null);
  const [simulatingCode, setSimulatingCode] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      // Sync server configuration into the editable settings form.
      if (typeof data.settings.qr_welcome_points === 'number')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWelcomePts(data.settings.qr_welcome_points);
      if (typeof data.settings.qr_entry_points === 'number')
        setEntryPts(data.settings.qr_entry_points);
      if (typeof data.settings.qr_exit_points === 'number')
        setExitPts(data.settings.qr_exit_points);
      if (typeof data.settings.qr_min_minutes === 'number')
        setMinMinutes(data.settings.qr_min_minutes);
    }
  }, [data?.settings]);

  const currentPointsFor = (station: Station) => {
    if (station.kind === 'bienvenida') return welcomePts;
    if (station.kind === 'salida') return exitPts;
    return entryPts;
  };

  const handleSavePoints = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingPoints(true);
    try {
      await api('configuracion', {
        method: 'PATCH',
        body: JSON.stringify({
          qr_welcome_points: Number(welcomePts),
          qr_entry_points: Number(entryPts),
          qr_exit_points: Number(exitPts),
          qr_min_minutes: Number(minMinutes),
        }),
      });
      toast.success('¡Puntos por QR actualizados correctamente!', {
        description: `Bienvenida: ${welcomePts} pts · Entrada: ${entryPts} pt · Salida: ${exitPts} pts · Dwell: ${minMinutes} min`,
      });
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar los puntos');
    } finally {
      setSavingPoints(false);
    }
  };

  // Generar códigos QR para todas las estaciones con la URL canónica
  useEffect(() => {
    async function generateQrs() {
      const urls: Record<string, string> = {};
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://aranjeuez-xi.vercel.app';
      for (const st of STATIONS) {
        try {
          const scanUrl = `${origin}/qr/${st.code}`;
          const dataUrl = await QRCode.toDataURL(scanUrl, {
            width: 340,
            margin: 2,
            color: {
              dark: '#030B1A',
              light: '#FFFFFF',
            },
          });
          urls[st.code] = dataUrl;
        } catch (e) {
          console.error('Error generating QR for', st.code, e);
        }
      }
      setQrImages(urls);
    }
    generateQrs();
  }, []);

  const handleCopy = (code: string) => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://aranjeuez-xi.vercel.app';
    const scanUrl = `${origin}/qr/${code}`;
    navigator.clipboard.writeText(scanUrl);
    toast.success('Enlace de escaneo copiado', { description: scanUrl });
  };

  const handleSimulateScan = async (station: Station) => {
    setSimulatingCode(station.code);
    try {
      const res = await api<{ ok: boolean; message: string; pointsAwarded?: number }>('checkin', {
        method: 'POST',
        body: JSON.stringify({ code: station.code }),
      });
      toast.success(res.message || 'Escaneo registrado con éxito', {
        description: `Estación: ${station.name} (+${res.pointsAwarded ?? currentPointsFor(station)} pts)`,
      });
      reload();
    } catch (e) {
      toast.info(e instanceof Error ? e.message : 'No se pudo simular');
    } finally {
      setSimulatingCode(null);
    }
  };

  const handleGenerateDemoData = async () => {
    setActionBusy(true);
    try {
      const res = await api<{ ok: boolean; created?: number; message: string }>('mapa-calor', {
        method: 'POST',
        body: JSON.stringify({ accion: 'demo' }),
      });
      toast.success(res.message || 'Datos de prueba coherentes generados.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron generar datos de prueba.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleClearDemoData = async () => {
    if (
      !confirm(
        '¿Deseas eliminar todos los escaneos de prueba? Los datos reales de clientes se conservarán intactos.',
      )
    ) {
      return;
    }
    setActionBusy(true);
    try {
      const res = await api<{ ok: boolean; message: string }>('mapa-calor', {
        method: 'POST',
        body: JSON.stringify({ accion: 'limpiar' }),
      });
      toast.success(res.message || 'Datos de prueba eliminados.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al limpiar datos.');
    } finally {
      setActionBusy(false);
    }
  };

  const filteredStations =
    activeFloorFilter === 'todos'
      ? STATIONS
      : STATIONS.filter((s) => s.floorId === activeFloorFilter);

  // Filtrar eventos de telemetría recientes
  const telemetryLogs = (data?.audit || [])
    .filter(
      (a) =>
        a.action === 'telemetry_scan' ||
        (a.detail && (a.detail.x !== undefined || a.detail.totem_code || a.detail.station_code)),
    )
    .slice(0, 35);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageTitle
        eyebrow="Control de Acceso & Telemetría Espacial"
        title="Tótems Físicos & Códigos QR por Piso (Inicio y Salida)"
        description="Imprime o comparte los códigos QR para cada nivel. Los clientes suman 1 a 2 puntos por recorrer el Paseo sin necesidad de comprar, mapeando de forma anónima los flujos peatonales."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={actionBusy}
            onClick={handleGenerateDemoData}
            className="button small flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold shadow-md"
            title="Genera recorridos coherentes con horas pico para visualizar el mapa de calor"
          >
            <Sparkles size={14} /> ⚡ Generar Datos de Prueba (7 días)
          </button>
          <button
            disabled={actionBusy}
            onClick={handleClearDemoData}
            className="button secondary small flex items-center gap-1.5 text-red-300 hover:text-red-200 border-red-500/30"
            title="Borra únicamente los registros de prueba generados"
          >
            <Trash2 size={14} /> Limpiar Pruebas
          </button>
          <button className="button secondary small flex items-center gap-1.5" onClick={reload}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </PageTitle>

      {/* Panel de Control de Puntos QR (Solo Administrador) */}
      <div className="p-5 rounded-2xl bg-[#061734]/90 border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              ⚙️
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Configuración de Puntos por QR & Permanencia
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                  Solo Administrador
                </span>
              </h3>
              <p className="text-xs text-white/60">
                Ajusta en tiempo real cuántos puntos otorga cada tótem y el tiempo mínimo para
                validar la salida de un piso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPointsPanelOpen(!pointsPanelOpen)}
            className="button secondary small self-start sm:self-auto text-xs flex items-center gap-1.5"
          >
            {pointsPanelOpen ? 'Cerrar Editor' : '✏️ Modificar Puntos'}
          </button>
        </div>

        {pointsPanelOpen ? (
          <form onSubmit={handleSavePoints} className="space-y-4 pt-1 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="text-xs font-semibold text-slate-300 space-y-1 block">
                <span>🚪 Puntos Bienvenida (Puertas)</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  required
                  value={welcomePts}
                  onChange={(e) => setWelcomePts(Number(e.target.value))}
                  className="w-full bg-[#030B1A] border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 outline-none"
                />
                <span className="text-[10px] text-white/50 block">
                  Puertas Av. América y Dalence (1x al día)
                </span>
              </label>

              <label className="text-xs font-semibold text-slate-300 space-y-1 block">
                <span>⬆️ Puntos Entrada a Piso</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={entryPts}
                  onChange={(e) => setEntryPts(Number(e.target.value))}
                  className="w-full bg-[#030B1A] border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 outline-none"
                />
                <span className="text-[10px] text-white/50 block">
                  PB, P1, P2, P3, S1 (1x al día)
                </span>
              </label>

              <label className="text-xs font-semibold text-slate-300 space-y-1 block">
                <span>⬇️ Puntos Salida de Piso</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={exitPts}
                  onChange={(e) => setExitPts(Number(e.target.value))}
                  className="w-full bg-[#030B1A] border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 outline-none"
                />
                <span className="text-[10px] text-white/50 block">
                  Fin del recorrido del piso (1x al día)
                </span>
              </label>

              <label className="text-xs font-semibold text-slate-300 space-y-1 block">
                <span>⏱️ Permanencia Mínima (Minutos)</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  required
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(Number(e.target.value))}
                  className="w-full bg-[#030B1A] border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 outline-none"
                />
                <span className="text-[10px] text-white/50 block">
                  Tiempo requerido antes de validar salida
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPointsPanelOpen(false)}
                className="button secondary small text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPoints}
                className="button small bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                {savingPoints ? 'Guardando...' : '💾 Guardar Cambios en Vivo'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] text-white/60">Bienvenida</div>
              <div className="text-lg font-black text-amber-400">+{welcomePts} pts</div>
              <div className="text-[10px] text-white/40">1 vez al día</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] text-white/60">Entrada a Piso</div>
              <div className="text-lg font-black text-emerald-400">+{entryPts} pt</div>
              <div className="text-[10px] text-white/40">1 vez por piso/día</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] text-white/60">Salida de Piso</div>
              <div className="text-lg font-black text-blue-400">+{exitPts} pts</div>
              <div className="text-[10px] text-white/40">Con entrada previa</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] text-white/60">Permanencia Mínima</div>
              <div className="text-lg font-black text-purple-400">{minMinutes} min</div>
              <div className="text-[10px] text-white/40">Anti-spam entre entrada y salida</div>
            </div>
          </div>
        )}
      </div>

      {/* Explicación de la Lógica de Puntos por Recorrido */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#061734] via-[#09224d] to-[#061734] border border-[#FF6B1A]/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF6B1A]" />
            <h3 className="text-sm font-bold text-white">
              Regla de Puntos de Mapeo Peatonal (Sin Compra Obligatoria)
            </h3>
          </div>
          <p className="text-xs text-white/70 max-w-3xl leading-relaxed">
            • <strong>Bienvenida (+{welcomePts} pts):</strong> 1 vez al día en puertas principales
            (Av. América o Dalence).
            <br />• <strong>Inicio de Piso (+{entryPts} pt):</strong> Al llegar al nivel por
            ascensor o gradas.
            <br />• <strong>Salida de Piso (+{exitPts} pts):</strong> Al finalizar el recorrido del
            nivel (requiere haber iniciado el piso y pasar al menos {minMinutes} minutos).
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
            {STATIONS.length} Estaciones Activas
          </span>
        </div>
      </div>

      {/* Filtros por Piso */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#061734]/80 border border-white/10">
        <button
          onClick={() => setActiveFloorFilter('todos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFloorFilter === 'todos'
              ? 'bg-[#FF6B1A] text-white shadow-md'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          Todos ({STATIONS.length})
        </button>
        {FLOORS.map((f) => {
          const count = STATIONS.filter((s) => s.floorId === f.id).length;
          const isActive = activeFloorFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFloorFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4A24C] to-[#FF8F4D] text-[#030B1A] font-black shadow-md'
                  : 'text-white/70 hover:text-white bg-white/5'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/50'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Estaciones QR Físicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStations.map((station) => {
          const isWelcome = station.kind === 'bienvenida';
          const isExit = station.kind === 'salida';
          return (
            <article
              key={station.code}
              className={`p-5 rounded-2xl bg-[#061734]/90 border flex flex-col justify-between transition-all shadow-xl hover:scale-[1.01] ${
                isWelcome
                  ? 'border-[#FF6B1A]/40 hover:border-[#FF6B1A]'
                  : isExit
                    ? 'border-emerald-500/40 hover:border-emerald-400'
                    : 'border-sky-500/40 hover:border-sky-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                      isWelcome
                        ? 'bg-[#FF6B1A]/20 text-[#FF6B1A] border-[#FF6B1A]/30'
                        : isExit
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {isWelcome ? (
                      <Sparkles size={11} />
                    ) : isExit ? (
                      <LogOut size={11} />
                    ) : (
                      <DoorOpen size={11} />
                    )}
                    {isWelcome ? 'Bienvenida' : isExit ? 'Salida' : 'Inicio'} (+
                    {currentPointsFor(station)} pts)
                  </span>
                  <span className="text-[10px] font-mono text-white/50">Piso Z: {station.z}</span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug mb-1">{station.name}</h3>
                <p className="text-xs text-[#D4A24C] font-semibold mb-2">{station.floorLabel}</p>

                {/* Preview del Código QR */}
                <div className="p-3 bg-white rounded-xl flex items-center justify-center my-3 shadow-inner">
                  {qrImages[station.code] ? (
                    <Image
                      src={qrImages[station.code]}
                      alt={station.name}
                      width={170}
                      height={170}
                      unoptimized
                      className="rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-black/40 text-xs">
                      Generando QR...
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-white/60 font-sans leading-relaxed mb-3">
                  📍 {station.place}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>
                    Coord: ({station.x}%, {station.y}%)
                  </span>
                  <span>{station.code}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopy(station.code)}
                    className="py-2 px-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-1.5 transition-all"
                    title="Copiar URL directa para cámara o WhatsApp"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <button
                    onClick={() => setPrintStation(station)}
                    className="py-2 px-2 rounded-xl text-xs font-bold bg-[#B84D0B] hover:bg-[#FF6B1A] text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                    title="Ver ficha de impresión para mostrador o pared"
                  >
                    <Printer size={13} /> Imprimir
                  </button>
                </div>

                <button
                  onClick={() => handleSimulateScan(station)}
                  disabled={simulatingCode === station.code}
                  className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Flame size={12} className="text-[#FF6B1A]" />
                  <span>
                    {simulatingCode === station.code ? 'Simulando…' : 'Probar escaneo como cliente'}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Monitor en Vivo de Telemetría y Escaneos */}
      <section className="p-6 rounded-3xl bg-[#061734]/60 border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Feed de Telemetría Peatonal en Vivo</span>
            </div>
            <h2 className="text-xl font-bold text-white">Últimos Escaneos Registrados</h2>
            <p className="text-xs text-white/50">
              Registros capturados cuando los visitantes escanean en tótems de entrada/salida o
              puntos comerciales.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              Perímetro Aranjuez: <strong>200m</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !telemetryLogs.length ? (
          <Empty
            title="Sin escaneos registrados aún"
            detail="Usa el botón '⚡ Generar Datos de Prueba' arriba o haz clic en 'Probar escaneo' en cualquier estación."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Hora</th>
                  <th className="pb-3">Estación / Punto</th>
                  <th className="pb-3">Nivel (Z)</th>
                  <th className="pb-3">Coordenadas</th>
                  <th className="pb-3">Puntos</th>
                  <th className="pb-3">Origen</th>
                  <th className="pb-3 pr-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {telemetryLogs.map((log) => {
                  const d = (log.detail || {}) as Record<string, unknown>;
                  const time = new Date(log.created_at).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const isDemo = Boolean(d.demo);
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-2 font-mono text-white/50">{time}</td>
                      <td className="py-3">
                        <strong className="text-white block">
                          {String(d.totem_name || d.station_code || 'Punto de Acceso')}
                        </strong>
                        <span className="text-[10px] text-white/40 font-mono">
                          {String(d.station_code || d.totem_code || '')}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-[#D4A24C]">
                        {String(d.floor || `Piso ${d.z ?? 0}`)}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-emerald-400">
                        {d.x !== undefined && d.y !== undefined
                          ? `X:${d.x}%, Y:${d.y}%`
                          : 'Central'}
                      </td>
                      <td className="py-3 font-bold text-[#FF6B1A]">
                        {d.points_granted ? `+${d.points_granted} pts` : '+0 pts'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDemo
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isDemo ? 'Prueba Coherente' : 'Visita Real'}
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

      {/* Modal Ficha Imprimible de Estación QR */}
      {printStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-8 bg-[#030B1A] border border-[#FF6B1A]/40 rounded-3xl text-center shadow-2xl space-y-4">
            <button
              onClick={() => setPrintStation(null)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full bg-white/5"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Ficha Oficial de Recorrido
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">PASEO ARANJUEZ</h3>
              <p className="text-sm text-[#D4A24C] font-bold mt-1">{printStation.name}</p>
              <p className="text-xs text-white/60">
                {printStation.floorLabel} · {printStation.place}
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

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1">
              <p className="font-bold text-white">📲 Escanea con la cámara de tu celular</p>
              <p className="text-emerald-400 font-bold">
                ¡Suma +{printStation.points}{' '}
                {printStation.points === 1 ? 'Paseo Point' : 'Paseo Points'} gratis sin comprar!
              </p>
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
