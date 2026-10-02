'use client';

import React, { useState } from 'react';
import {
  DollarSign, ShoppingCart, CreditCard, Package, Users, TrendingUp,
  TrendingDown, AlertTriangle, Clock, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import {
  demoOrders, demoDailySales, demoProductSales, demoCategorySales,
  demoAlerts, demoProducts, demoPayments
} from '@/lib/demo-data';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ============ KPI Card ============
function KPICard({ title, value, change, changeLabel, icon: Icon, color, suffix }: {
  title: string; value: string; change?: number; changeLabel?: string;
  icon: typeof DollarSign; color: string; suffix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${isPositive ? 'bg-green-tactical/10 text-green-tactical' : 'bg-red-alert/10 text-red-alert'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}{suffix}</div>
      <div className="text-xs text-tactical-500">{changeLabel || title}</div>
    </div>
  );
}

// ============ Chart Tooltip ============
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
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

import { useStore } from '@/context/StoreContext';

export default function AdminOverviewPage() {
  const { products, alerts } = useStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate KPIs from store and demo data
  const today = new Date().toISOString().split('T')[0];
  const todaySales = demoDailySales.find(d => d.date === today);
  const totalSalesMonth = demoDailySales.reduce((s, d) => s + d.total_sales, 0);
  const totalOrdersMonth = demoDailySales.reduce((s, d) => s + d.order_count, 0);
  const avgTicket = totalSalesMonth / Math.max(totalOrdersMonth, 1);
  const pendingOrders = demoOrders.filter(o => o.status === 'pending').length;
  const pendingPayments = demoPayments.filter(p => p.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock <= p.low_stock_threshold).length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  // Chart data
  const salesData = demoDailySales.slice(timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : -90).map(d => ({
    date: d.date.substring(5),
    ventas: d.total_sales,
    ordenes: d.order_count,
  }));

  const topProducts = demoProductSales.slice(0, 8).map(p => ({
    name: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name,
    revenue: p.total_revenue,
    sold: p.total_sold,
  }));

  const categoryData = demoCategorySales.map(c => ({
    name: c.category_name,
    value: c.total_sales,
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

  // Feed data
  const recentOrders = demoOrders.slice(0, 5);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'badge-pending', paid: 'badge-paid', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
    const labelMap: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{labelMap[status] || status}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 stagger-children">
        <KPICard title="Ventas Hoy" value={`Bs. ${(todaySales?.total_sales || 0).toLocaleString()}`} change={12.5} changeLabel="vs. ayer" icon={DollarSign} color="#f59e0b" />
        <KPICard title="Ventas Mes" value={`Bs. ${Math.round(totalSalesMonth).toLocaleString()}`} change={8.3} changeLabel="vs. mes anterior" icon={TrendingUp} color="#10b981" />
        <KPICard title="Órdenes Pendientes" value={pendingOrders.toString()} icon={ShoppingCart} color={pendingOrders > 0 ? '#ef4444' : '#10b981'} />
        <KPICard title="Pagos por Verificar" value={pendingPayments.toString()} icon={CreditCard} color={pendingPayments > 0 ? '#f59e0b' : '#10b981'} />
        <KPICard title="Stock Bajo" value={lowStockProducts.toString()} icon={Package} color={lowStockProducts > 0 ? '#ef4444' : '#10b981'} />
        <KPICard title="Ticket Promedio" value={`Bs. ${avgTicket.toFixed(2)}`} change={5.2} icon={DollarSign} color="#3b82f6" />
        <KPICard title="Total Órdenes" value={totalOrdersMonth.toString()} change={15.7} changeLabel="mes" icon={ShoppingCart} color="#8b5cf6" />
        <KPICard title="Productos Activos" value={products.filter(p => p.is_active).length.toString()} icon={Package} color="#06b6d4" />
        <KPICard title="Alertas Activas" value={unresolvedAlerts.toString()} icon={AlertTriangle} color={unresolvedAlerts > 0 ? '#ef4444' : '#10b981'} />
        <KPICard title="Tasa Conversión" value="23.5" suffix="%" change={2.1} icon={ArrowUpRight} color="#10b981" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card-static p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Ventas por Día</h3>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${timeRange === r ? 'bg-amber-accent/20 text-amber-accent' : 'text-tactical-500 hover:text-tactical-300'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5a7291' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5a7291' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#f59e0b" fill="url(#salesGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut (1 col) */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ventas por Categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-[10px] text-tactical-400">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {c.name.substring(0, 15)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="glass-card-static p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Productos Más Vendidos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#5a7291' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: '#8da3be' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Ingresos" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass-card-static p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-tactical animate-pulse" /> Feed en Vivo
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={14} className="text-tactical-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-tactical-200 font-mono truncate">{order.id.toUpperCase()}</div>
                    <div className="text-[10px] text-tactical-500">
                      {new Date(order.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(order.status)}
                  <span className="text-sm font-bold text-white">Bs. {order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Alerts in feed */}
            {demoAlerts.filter(a => !a.resolved).map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-alert/5 border border-red-alert/10">
                <AlertTriangle size={14} className="text-red-alert flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-tactical-200 truncate">{alert.message}</div>
                  <div className="text-[10px] text-tactical-500">{new Date(alert.created_at).toLocaleDateString('es')}</div>
                </div>
                <span className={`badge badge-${alert.severity} flex-shrink-0`}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
