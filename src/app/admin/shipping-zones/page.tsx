'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  RotateCcw,
  Store,
  Truck,
  Building,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ShippingZone } from '@/lib/types';

// Preset shortcuts for fast configuration in Cochabamba
const COCHABAMBA_PRESETS = [
  {
    label: 'Centro / Casco Viejo (Bs. 12)',
    name: 'Cochabamba — Centro / Casco Viejo / Las Cuadras / San Pedro',
    department: 'Cochabamba',
    city: 'Cochabamba (Cercado)',
    cost: '12.00',
    commission: '8.00',
    hours: '2',
  },
  {
    label: 'Zona Norte / Cala Cala (Bs. 15)',
    name: 'Cochabamba — Zona Norte (Cala Cala, Queru Queru, Av. América, Tupuraya)',
    department: 'Cochabamba',
    city: 'Cochabamba (Cercado)',
    cost: '15.00',
    commission: '10.00',
    hours: '3',
  },
  {
    label: 'Zona Sur / Jaihuayco (Bs. 15)',
    name: 'Cochabamba — Zona Sur (Jaihuayco, Lacma, La Chimba, Albarrancho)',
    department: 'Cochabamba',
    city: 'Cochabamba (Cercado)',
    cost: '15.00',
    commission: '10.00',
    hours: '3',
  },
  {
    label: 'Quillacollo & Colcapirhua (Bs. 20)',
    name: 'Cochabamba Metropolitana — Quillacollo y Colcapirhua (Delivery Express)',
    department: 'Cochabamba',
    city: 'Quillacollo',
    cost: '20.00',
    commission: '15.00',
    hours: '4',
  },
  {
    label: 'Sacaba / Huayllani (Bs. 20)',
    name: 'Cochabamba Metropolitana — Sacaba (Delivery Express)',
    department: 'Cochabamba',
    city: 'Sacaba',
    cost: '20.00',
    commission: '15.00',
    hours: '4',
  },
  {
    label: 'Tiquipaya (Bs. 18)',
    name: 'Cochabamba Metropolitana — Tiquipaya (Delivery Express)',
    department: 'Cochabamba',
    city: 'Tiquipaya',
    cost: '18.00',
    commission: '13.00',
    hours: '4',
  },
  {
    label: 'Flota Terminal Cbba (Bs. 35)',
    name: 'Envío Nacional Flota — Desde Terminal de Buses Cbba (La Paz, Santa Cruz, Oruro, Sucre, Tarija, Potosí, Beni, Pando)',
    department: 'Nacional',
    city: 'Terminal Cochabamba',
    cost: '35.00',
    commission: '25.00',
    hours: '24',
  },
  {
    label: 'Courier Shalom Domicilio (Bs. 40)',
    name: 'Envío Nacional Courier — Shalom / Expreso a Domicilio desde Cochabamba',
    department: 'Nacional',
    city: 'Bolivia Courier',
    cost: '40.00',
    commission: '28.00',
    hours: '48',
  },
];

export default function AdminShippingZonesPage() {
  const {
    shippingZones,
    addShippingZone,
    updateShippingZone,
    deleteShippingZone,
    resetShippingZonesToDefaults,
    storeSettings,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'cercado' | 'conurbano' | 'nacional'>('all');

  // Form states
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Cochabamba');
  const [city, setCity] = useState('Cochabamba');
  const [shippingCost, setShippingCost] = useState('15.00');
  const [driverCommission, setDriverCommission] = useState('10.00');
  const [estimatedHours, setEstimatedHours] = useState('3');

  const calculatedMargin = Math.max(0, Number(shippingCost || 0) - Number(driverCommission || 0));

  // Filtered zones
  const filteredZones = useMemo(() => {
    if (filterCategory === 'all') return shippingZones;
    if (filterCategory === 'cercado') {
      return shippingZones.filter(
        z =>
          (z.city?.toLowerCase().includes('cochabamba') || z.name.toLowerCase().includes('centro') || z.name.toLowerCase().includes('norte') || z.name.toLowerCase().includes('sur')) &&
          !z.name.toLowerCase().includes('nacional') &&
          !z.name.toLowerCase().includes('quillacollo') &&
          !z.name.toLowerCase().includes('sacaba') &&
          !z.name.toLowerCase().includes('tiquipaya')
      );
    }
    if (filterCategory === 'conurbano') {
      return shippingZones.filter(
        z =>
          z.name.toLowerCase().includes('quillacollo') ||
          z.name.toLowerCase().includes('colcapirhua') ||
          z.name.toLowerCase().includes('sacaba') ||
          z.name.toLowerCase().includes('tiquipaya')
      );
    }
    if (filterCategory === 'nacional') {
      return shippingZones.filter(
        z =>
          z.name.toLowerCase().includes('nacional') ||
          z.name.toLowerCase().includes('flota') ||
          z.name.toLowerCase().includes('courier') ||
          z.department?.toLowerCase() === 'nacional'
      );
    }
    return shippingZones;
  }, [shippingZones, filterCategory]);

  const handleOpenAdd = () => {
    setEditingZone(null);
    setName('');
    setDepartment('Cochabamba');
    setCity('Cochabamba');
    setShippingCost('15.00');
    setDriverCommission('10.00');
    setEstimatedHours('3');
    setModalOpen(true);
  };

  const handleOpenEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setName(zone.name);
    setDepartment(zone.department || 'Cochabamba');
    setCity(zone.city || 'Cochabamba');
    setShippingCost(zone.shipping_cost.toString());
    setDriverCommission(zone.driver_commission.toString());
    setEstimatedHours(zone.estimated_hours.toString());
    setModalOpen(true);
  };

  const applyPreset = (preset: typeof COCHABAMBA_PRESETS[0]) => {
    setName(preset.name);
    setDepartment(preset.department);
    setCity(preset.city);
    setShippingCost(preset.cost);
    setDriverCommission(preset.commission);
    setEstimatedHours(preset.hours);
    toast.info(`Plantilla "${preset.label}" aplicada`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Ingresa el nombre de la zona');
      return;
    }

    const costNum = parseFloat(shippingCost);
    const commNum = parseFloat(driverCommission);
    const hoursNum = parseInt(estimatedHours, 10);

    if (isNaN(costNum) || isNaN(commNum) || costNum < 0 || commNum < 0) {
      toast.error('Los costos y comisiones deben ser valores numéricos válidos en Bs.');
      return;
    }

    if (commNum > costNum) {
      toast.warning('La comisión del repartidor es mayor a lo que paga el cliente. El margen será negativo.');
    }

    if (editingZone) {
      updateShippingZone(editingZone.id, {
        name: name.trim(),
        department: department.trim() || null,
        city: city.trim() || null,
        shipping_cost: costNum,
        driver_commission: commNum,
        estimated_hours: hoursNum || 24,
      });
    } else {
      addShippingZone({
        name: name.trim(),
        department: department.trim() || undefined,
        city: city.trim() || undefined,
        shipping_cost: costNum,
        driver_commission: commNum,
        estimated_hours: hoursNum || 24,
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, zoneName: string) => {
    deleteShippingZone(id);
  };

  const handleResetDefaults = () => {
    resetShippingZonesToDefaults();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#C8A961] uppercase block mb-1">
            BASE LOGÍSTICA // COCHABAMBA, BOLIVIA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión de Zonas de Envío (Bs.)
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Tarifas de delivery urbano en Cochabamba, conurbano metropolitano y flotas interdepartamentales desde la Terminal de Buses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="btn-outline-gold text-xs px-3.5 py-2.5 flex items-center gap-1.5"
            title="Restaurar las tarifas y zonas estándar de Cochabamba"
          >
            <RotateCcw size={14} /> Restaurar Zonas Cochabamba
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-tactical text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-lg shadow-[#C8A961]/10"
          >
            <Plus size={16} /> Nueva Zona
          </button>
        </div>
      </div>

      {/* Warehouse & Base Location Card */}
      <div className="glass-card-static p-4 sm:p-5 border border-[#C8A961]/30 bg-gradient-to-r from-[#C8A961]/10 via-transparent to-[#C8A961]/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C8A961]/20 border border-[#C8A961]/40 flex items-center justify-center text-[#C8A961] flex-shrink-0 mt-0.5">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Almacén Central & Tienda Física // Cochabamba
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RECOJO BS. 0.00
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#C8A961]" />
                <strong>Dirección de Retiro:</strong> {storeSettings.pickupAddress}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                <Clock size={12} className="text-[#C8A961]" />
                <strong>Horario de Atención:</strong> {storeSettings.pickupSchedule}
              </p>
            </div>
          </div>

          <Link
            href="/admin/settings"
            className="text-xs font-mono text-[#C8A961] hover:underline flex items-center gap-1 whitespace-nowrap self-start md:self-center"
          >
            Modificar Almacén Central <Navigation size={12} />
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-static p-4 border border-white/[0.06]">
          <span className="text-xs font-mono uppercase text-neutral-400">Total Rutas Activas</span>
          <div className="text-2xl font-mono font-bold text-white mt-1">{shippingZones.length}</div>
          <span className="text-[11px] text-neutral-500">Cochabamba y Rutas Nacionales</span>
        </div>

        <div className="glass-card-static p-4 border border-white/[0.06]">
          <span className="text-xs font-mono uppercase text-neutral-400">Costo Promedio Envío</span>
          <div className="text-2xl font-mono font-bold text-[#C8A961] mt-1">
            Bs.{' '}
            {(
              shippingZones.reduce((acc, z) => acc + z.shipping_cost, 0) /
              (shippingZones.length || 1)
            ).toFixed(2)}
          </div>
          <span className="text-[11px] text-neutral-500">Tarifa cobrada al cliente</span>
        </div>

        <div className="glass-card-static p-4 border border-white/[0.06]">
          <span className="text-xs font-mono uppercase text-neutral-400">Comisión Repartidor Promedio</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            Bs.{' '}
            {(
              shippingZones.reduce((acc, z) => acc + z.driver_commission, 0) /
              (shippingZones.length || 1)
            ).toFixed(2)}
          </div>
          <span className="text-[11px] text-neutral-500">Ingreso directo para el repartidor</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
            filterCategory === 'all'
              ? 'bg-[#C8A961] text-black font-bold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white'
          }`}
        >
          Todas las Zonas ({shippingZones.length})
        </button>
        <button
          onClick={() => setFilterCategory('cercado')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
            filterCategory === 'cercado'
              ? 'bg-[#C8A961] text-black font-bold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white'
          }`}
        >
          <Truck size={13} /> Cercado / Urbano (Centro, Norte, Sur)
        </button>
        <button
          onClick={() => setFilterCategory('conurbano')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
            filterCategory === 'conurbano'
              ? 'bg-[#C8A961] text-black font-bold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white'
          }`}
        >
          <Truck size={13} /> Conurbano (Quillacollo, Sacaba, Tiquipaya)
        </button>
        <button
          onClick={() => setFilterCategory('nacional')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
            filterCategory === 'nacional'
              ? 'bg-[#C8A961] text-black font-bold'
              : 'bg-white/[0.04] text-neutral-400 hover:text-white'
          }`}
        >
          <Building size={13} /> Flotas Nacionales (Terminal Cbba)
        </button>
      </div>

      {/* Zones Table / Cards */}
      <div className="glass-card-static border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-tactical w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono">
                <th className="py-3 px-4">Zona / Cobertura</th>
                <th className="py-3 px-4">Municipio / Región</th>
                <th className="py-3 px-4">Tarifa Cliente</th>
                <th className="py-3 px-4">Pago Repartidor</th>
                <th className="py-3 px-4">Margen Tienda</th>
                <th className="py-3 px-4">Tiempo Estimado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredZones.map(zone => {
                const profit = zone.shipping_cost - zone.driver_commission;
                const isNational = zone.name.toLowerCase().includes('nacional');
                const isConurbano =
                  zone.name.toLowerCase().includes('quillacollo') ||
                  zone.name.toLowerCase().includes('sacaba') ||
                  zone.name.toLowerCase().includes('tiquipaya');

                return (
                  <tr key={zone.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {isNational ? (
                          <Building size={14} className="text-blue-400 flex-shrink-0" />
                        ) : isConurbano ? (
                          <Truck size={14} className="text-amber-400 flex-shrink-0" />
                        ) : (
                          <MapPin size={14} className="text-[#C8A961] flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-white text-sm block">{zone.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {isNational
                              ? 'DESPACHO POR FLOTA DESDE TERMINAL COCHABAMBA'
                              : isConurbano
                              ? 'CONURBANO COCHABAMBA METROPOLITANA'
                              : 'DELIVERY URBANO EN COCHABAMBA CERCADO'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[11px] font-mono">
                        {zone.department || 'Cochabamba'} {zone.city ? `· ${zone.city}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      Bs. {zone.shipping_cost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      +Bs. {zone.driver_commission.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C8A961]">
                      Bs. {profit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} /> ~{zone.estimated_hours} hrs
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(zone)}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 transition"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id, zone.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD with Cochabamba Presets */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card-static max-w-xl w-full p-6 border border-[#C8A961]/40 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingZone ? 'Editar Zona de Envío (Cochabamba / Bolivia)' : 'Configurar Nueva Zona de Envío (Cochabamba / Bolivia)'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Tarifas en Bolivianos (Bs.), comisiones directas al repartidor motorizado y tiempos estimados de entrega.
            </p>

            {/* Quick Cochabamba Presets Strip */}
            {!editingZone && (
              <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <span className="text-[10px] font-mono uppercase text-[#C8A961] font-bold block mb-2 flex items-center gap-1">
                  <Sparkles size={12} /> Plantillas Rápidas para Cochabamba:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COCHABAMBA_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-[#C8A961]/10 hover:bg-[#C8A961]/25 text-[#C8A961] border border-[#C8A961]/30 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 uppercase font-mono mb-1">
                  Nombre de la Zona / Cobertura *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Cochabamba — Zona Norte (Cala Cala, Queru Queru, Av. América)"
                  className="input-tactical"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase font-mono mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="Ej. Cochabamba"
                    className="input-tactical"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 uppercase font-mono mb-1">
                    Municipio / Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ej. Cercado / Quillacollo / Sacaba / Tiquipaya"
                    className="input-tactical"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 uppercase font-mono mb-1">
                    Costo al Cliente (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={shippingCost}
                    onChange={e => setShippingCost(e.target.value)}
                    className="input-tactical font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Lo que paga el comprador</span>
                </div>

                <div>
                  <label className="block text-emerald-400 uppercase font-mono mb-1">
                    Comisión Repartidor (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={driverCommission}
                    onChange={e => setDriverCommission(e.target.value)}
                    className="input-tactical font-mono border-emerald-500/30"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Gana el repartidor</span>
                </div>
              </div>

              {/* Profit Preview Box */}
              <div className="p-3 rounded-xl bg-[#C8A961]/10 border border-[#C8A961]/20 flex items-center justify-between text-xs">
                <span className="text-neutral-300">Margen Calculado para la Tienda:</span>
                <span className="font-mono font-bold text-base text-[#C8A961]">
                  Bs. {calculatedMargin.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase font-mono mb-1">
                  Tiempo Estimado de Entrega (Horas)
                </label>
                <input
                  type="number"
                  required
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(e.target.value)}
                  className="input-tactical font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Ej. 2 para Centro, 4 para Quillacollo/Sacaba, 24 para Flota Nacional
                </span>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline-gold flex-1 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-tactical flex-1 py-2 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> Guardar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
