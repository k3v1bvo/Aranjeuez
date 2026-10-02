'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Settings,
  Mail,
  QrCode,
  Bell,
  Database,
  Globe,
  MapPin,
  Clock,
  Gift,
  CheckCircle2,
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { storeSettings, updateStoreSettings } = useStore();

  // Local state for Bolivia & Pickup settings
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [currency, setCurrency] = useState(storeSettings.currency || 'BOB');
  const [currencySymbol, setCurrencySymbol] = useState(storeSettings.currencySymbol || 'Bs.');
  const [pickupAddress, setPickupAddress] = useState(storeSettings.pickupAddress);
  const [pickupSchedule, setPickupSchedule] = useState(storeSettings.pickupSchedule);
  const [pickupInstructions, setPickupInstructions] = useState(storeSettings.pickupInstructions);
  const [freeGiftName, setFreeGiftName] = useState(storeSettings.freeGiftName);
  const [freeGiftValue, setFreeGiftValue] = useState(storeSettings.freeGiftValue.toString());

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      storeName: storeName.trim(),
      currency,
      currencySymbol,
      pickupAddress: pickupAddress.trim(),
      pickupSchedule: pickupSchedule.trim(),
      pickupInstructions: pickupInstructions.trim(),
      freeGiftName: freeGiftName.trim(),
      freeGiftValue: parseFloat(freeGiftValue) || 35,
    });
    toast.success('Configuración logística de Bolivia y Recojo guardada exitosamente');
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      <div>
        <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">
          CONFIGURACIÓN GLOBAL // BOLIVIA
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Ajustes de moneda boliviana, puntos de recojo central, horarios de almacén y souvenirs promocionales.
        </p>
      </div>

      {/* Bolivia Logistics & Pickup Configuration */}
      <form onSubmit={handleSaveStoreSettings} className="glass-card-static p-6 border border-[#C8A961]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A961]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A961]/10 border border-[#C8A961]/30 flex items-center justify-center text-[#C8A961]">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Punto de Recojo Central & Promociones (Bolivia)
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C8A961]/20 text-[#C8A961] border border-[#C8A961]/30">
                  ACTIVO
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Esta información se muestra directamente a los clientes cuando eligen la opción &ldquo;Recojo en Tienda / Almacén Central&rdquo;.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Nombre de la Tienda
              </label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="input-tactical py-2.5 text-xs font-semibold text-white"
                placeholder="Ej. Tienda Táctica Cochabamba"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                Moneda del Sistema
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currency}
                  onChange={e => {
                    setCurrency(e.target.value);
                    if (e.target.value === 'BOB') setCurrencySymbol('Bs.');
                  }}
                  className="input-tactical py-2.5 text-xs font-mono"
                >
                  <option value="BOB">BOB — Boliviano</option>
                  <option value="USD">USD — Dólar</option>
                </select>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="input-tactical py-2.5 text-xs font-mono text-center"
                  placeholder="Símbolo (Bs.)"
                />
              </div>
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <label className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5 mb-1">
              <MapPin size={14} className="text-[#C8A961]" /> Dirección del Almacén / Tienda Central para Recojo
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={e => setPickupAddress(e.target.value)}
              className="input-tactical py-2.5 text-xs text-white"
              placeholder="Ej. Av. Heroínas #560 entre San Martín y 25 de Mayo, Zona Central, Cochabamba"
              required
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Aparecerá en el checkout y en la orden del cliente como punto de entrega con costo Bs. 0.00.
            </span>
          </div>

          {/* Pickup Schedule */}
          <div>
            <label className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-[#C8A961]" /> Horarios de Atención para Recojo en Tienda
            </label>
            <input
              type="text"
              value={pickupSchedule}
              onChange={e => setPickupSchedule(e.target.value)}
              className="input-tactical py-2.5 text-xs text-white font-mono"
              placeholder="Ej. Lunes a Sábado de 09:00 a 19:00 (Horario Continuo)"
              required
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Horario establecido para que los clientes retiren sus pedidos en persona.
            </span>
          </div>

          {/* Pickup Instructions */}
          <div>
            <label className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5 mb-1">
              <FileText size={14} className="text-[#C8A961]" /> Instrucciones de Retiro para el Cliente
            </label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={e => setPickupInstructions(e.target.value)}
              className="input-tactical py-2.5 text-xs text-white"
              placeholder="Ej. Presentar carnet de identidad o el código de tu orden al momento del recojo."
            />
          </div>

          {/* Souvenir Incentive */}
          <div className="pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={16} className="text-[#C8A961]" />
              <h4 className="text-xs font-mono uppercase font-bold text-white">
                Incentivo por Pago Completo 100% QR (Souvenir de Regalo)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Nombre del Souvenir / Regalo Táctico
                </label>
                <input
                  type="text"
                  value={freeGiftName}
                  onChange={e => setFreeGiftName(e.target.value)}
                  className="input-tactical py-2.5 text-xs text-white"
                  placeholder="Ej. Souvenir Táctico Sorpresa Oficial (Edición Especial)"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Valor Comercial (Bs.)
                </label>
                <input
                  type="number"
                  step="1"
                  value={freeGiftValue}
                  onChange={e => setFreeGiftValue(e.target.value)}
                  className="input-tactical py-2.5 text-xs text-white font-mono"
                  placeholder="35.00"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#C8A961]" />
              Se agrega automáticamente y sin costo al paquete cuando el cliente opta por pagar el 100% de la orden anticipado por QR.
            </p>
          </div>

          <button
            type="submit"
            className="btn-tactical text-xs px-5 py-2.5 flex items-center gap-2 mt-2 shadow-lg shadow-[#C8A961]/10"
          >
            <CheckCircle2 size={14} /> Guardar Parámetros de Tienda & Logística
          </button>
        </div>
      </form>

      {/* SMTP Config */}
      <div className="glass-card-static p-5 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">SMTP de Google Workspace</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Host SMTP</label>
            <input defaultValue="smtp.gmail.com" className="input-tactical py-2 text-xs" />
          </div>
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Puerto</label>
            <select defaultValue="465" className="input-tactical py-2 text-xs">
              <option value="465">465 (SSL)</option>
              <option value="587">587 (TLS)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Email</label>
            <input defaultValue="admin@tacticos.bo" className="input-tactical py-2 text-xs" />
          </div>
          <div>
            <label className="text-xs text-tactical-500 block mb-1">App Password</label>
            <input type="password" defaultValue="••••••••••••" className="input-tactical py-2 text-xs" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn-tactical text-xs" onClick={() => toast.success('Configuración SMTP guardada')}>Guardar</button>
          <button className="btn-ghost text-xs" onClick={() => toast.success('Correo de prueba enviado exitosamente')}>Enviar correo de prueba</button>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="glass-card-static p-5 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-[#C8A961]" />
          <h3 className="text-sm font-semibold text-white">Umbrales de Alerta</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Stock bajo (unidades)</label>
            <input type="number" defaultValue={5} className="input-tactical py-2 text-xs" />
          </div>
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Monto mínimo de orden (Bs.)</label>
            <input type="number" defaultValue={20} className="input-tactical py-2 text-xs" />
          </div>
          <div>
            <label className="text-xs text-tactical-500 block mb-1">Tiempo máx. verificación (min)</label>
            <input type="number" defaultValue={30} className="input-tactical py-2 text-xs" />
          </div>
        </div>
        <button className="btn-tactical mt-4 text-xs" onClick={() => toast.success('Umbrales actualizados')}>Guardar</button>
      </div>

      {/* Payment Methods */}
      <div className="glass-card-static p-5 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <QrCode size={18} className="text-[#C8A961]" />
          <h3 className="text-sm font-semibold text-white">Modalidades de Pago Habilitadas</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: '100% Pago Completo con QR (con Souvenir Sorpresa)', desc: 'Genera QR por el total. Otorga regalo táctico sorpresa al comprador.', enabled: true },
            { name: '50% Anticipo QR + 50% Saldo al Recibir', desc: 'Reserva pagando 50% por QR; saldo cobrado por repartidor/almacén.', enabled: true },
            { name: 'Pago Contra Entrega (100% en Destino)', desc: 'Pago íntegro en efectivo o QR al momento de recibir el producto.', enabled: true },
          ].map(method => (
            <div key={method.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div>
                <div className="text-xs font-semibold text-tactical-200">{method.name}</div>
                <div className="text-[11px] text-tactical-500">{method.desc}</div>
              </div>
              <span className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Activo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="glass-card-static p-5 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Database size={18} className="text-tactical-400" />
          <h3 className="text-sm font-semibold text-white">Base de Datos</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-ghost text-xs" onClick={() => toast.info('Vistas materializadas refrescadas')}>Refrescar vistas materializadas</button>
          <button className="btn-ghost text-xs" onClick={() => toast.info('Limpieza de logs iniciada')}>Limpiar logs antiguos</button>
          <button className="btn-ghost text-xs" onClick={() => toast.info('Backup programado')}>Programar backup</button>
        </div>
      </div>
    </div>
  );
}
