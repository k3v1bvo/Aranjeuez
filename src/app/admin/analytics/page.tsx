'use client';

import React, { useState } from 'react';
import { demoDailySales, demoProductSales, demoCategorySales } from '@/lib/demo-data';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static p-3 text-xs">
      <div className="text-tactical-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-white font-semibold">{p.name}: ${p.value.toLocaleString()}</div>
      ))}
    </div>
  );
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const salesData = demoDailySales.slice(period === '7d' ? -7 : period === '30d' ? -30 : -90);
  const totalRevenue = salesData.reduce((s, d) => s + d.total_sales, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.order_count, 0);
  const avgTicket = totalRevenue / Math.max(totalOrders, 1);

  const chartData = salesData.map(d => ({
    date: d.date.substring(5),
    ventas: d.total_sales,
    ordenes: d.order_count * 50,
    ticket: d.avg_ticket,
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white">Analíticas & Reportes</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-amber-accent text-tactical-900' : 'text-tactical-500 hover:text-tactical-300'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => toast.success('Reporte exportado')} className="btn-ghost flex items-center gap-1 text-sm">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="text-xs text-tactical-500 mb-1">Ingresos Totales</div>
          <div className="text-2xl font-bold text-white">Bs. {Math.round(totalRevenue).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="text-xs text-tactical-500 mb-1">Total Órdenes</div>
          <div className="text-2xl font-bold text-white">{totalOrders}</div>
        </div>
        <div className="metric-card">
          <div className="text-xs text-tactical-500 mb-1">Ticket Promedio</div>
          <div className="text-2xl font-bold text-white">Bs. {avgTicket.toFixed(2)}</div>
        </div>
      </div>

      {/* Revenue + Orders Chart */}
      <div className="glass-card-static p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Ingresos y Órdenes por Día</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5a7291' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#5a7291' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8da3be' }} />
              <Area type="monotone" dataKey="ventas" name="Ingresos" stroke="#f59e0b" fill="url(#revenueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="ordenes" name="Órdenes (×50)" stroke="#3b82f6" fill="url(#ordersGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products Revenue */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Productos por Ingresos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoProductSales.slice(0, 6).map(p => ({ name: p.product_name.substring(0, 18) + '...', revenue: p.total_revenue, sold: p.total_sold }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5a7291' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: '#5a7291' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Ingresos" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Distribución por Categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demoCategorySales.map(c => ({ name: c.category_name, value: Math.round(c.total_sales) }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {demoCategorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report scheduling */}
      <div className="glass-card-static p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Reportes Programados</h3>
        <p className="text-sm text-tactical-400 mb-4">Configura envíos automáticos de reportes por correo.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => toast.success('Reporte diario configurado')} className="btn-ghost text-sm flex items-center gap-2"><Calendar size={14} /> Diario</button>
          <button onClick={() => toast.success('Reporte semanal configurado')} className="btn-ghost text-sm flex items-center gap-2"><Calendar size={14} /> Semanal</button>
          <button onClick={() => toast.success('Reporte mensual configurado')} className="btn-ghost text-sm flex items-center gap-2"><Calendar size={14} /> Mensual</button>
        </div>
      </div>
    </div>
  );
}
